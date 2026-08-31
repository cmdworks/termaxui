use std::fmt;
use unicode_width::UnicodeWidthChar;
use vte::{Params, Perform};

use crate::cell::{Cell, CellAttributes};
use crate::cursor::{Cursor, CursorShape, SavedCursor};
use crate::events::TerminalEvent;
use crate::grid::{Grid, DEFAULT_MAX_SCROLLBACK};
use crate::osc::handle_osc;
use crate::sgr::handle_sgr;

pub struct Terminal {
    pub primary_grid: Grid,
    pub alt_grid: Grid,
    pub is_alt_screen: bool,
    pub cursor: Cursor,
    pub saved_cursor_primary: SavedCursor,
    pub saved_cursor_alt: SavedCursor,
    pub current_attr: CellAttributes,
    pub autowrap: bool,
    pub in_command: bool,
    pub sync_output: bool,
    pub tab_stops: Vec<bool>,
    pub events: Vec<TerminalEvent>,
    pub parser: vte::Parser,
}

impl fmt::Debug for Terminal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Terminal")
            .field("cols", &self.cols())
            .field("rows", &self.rows())
            .field("cursor", &self.cursor)
            .field("is_alt_screen", &self.is_alt_screen)
            .field("autowrap", &self.autowrap)
            .field("in_command", &self.in_command)
            .field("sync_output", &self.sync_output)
            .finish()
    }
}

impl Terminal {
    pub fn new(cols: usize, rows: usize) -> Self {
        Self::with_scrollback(cols, rows, DEFAULT_MAX_SCROLLBACK)
    }

    pub fn with_scrollback(cols: usize, rows: usize, max_scrollback: usize) -> Self {
        let cols = cols.max(1);
        let rows = rows.max(1);
        let default_attr = CellAttributes::default();

        let mut tab_stops = vec![false; cols.max(80)];
        for i in (0..tab_stops.len()).step_by(8) {
            tab_stops[i] = true;
        }

        Self {
            primary_grid: Grid::new(cols, rows, max_scrollback, default_attr),
            alt_grid: Grid::new(cols, rows, 0, default_attr),
            is_alt_screen: false,
            cursor: Cursor::default(),
            saved_cursor_primary: SavedCursor::default(),
            saved_cursor_alt: SavedCursor::default(),
            current_attr: default_attr,
            autowrap: true,
            in_command: false,
            sync_output: false,
            tab_stops,
            events: Vec::new(),
            parser: vte::Parser::new(),
        }
    }

    #[inline(always)]
    pub fn grid(&self) -> &Grid {
        if self.is_alt_screen {
            &self.alt_grid
        } else {
            &self.primary_grid
        }
    }

    #[inline(always)]
    pub fn grid_mut(&mut self) -> &mut Grid {
        if self.is_alt_screen {
            &mut self.alt_grid
        } else {
            &mut self.primary_grid
        }
    }

    pub fn cols(&self) -> usize {
        self.grid().cols
    }

    pub fn rows(&self) -> usize {
        self.grid().rows
    }

    pub fn process_bytes(&mut self, bytes: &[u8]) {
        let mut parser = std::mem::replace(&mut self.parser, vte::Parser::new());
        for &byte in bytes {
            parser.advance(self, byte);
        }
        self.parser = parser;
    }

    pub fn drain_events(&mut self) -> Vec<TerminalEvent> {
        std::mem::take(&mut self.events)
    }

    pub fn resize(&mut self, cols: usize, rows: usize) {
        let cols = cols.max(1);
        let rows = rows.max(1);
        self.primary_grid.resize(cols, rows, self.current_attr);
        self.alt_grid.resize(cols, rows, self.current_attr);

        self.cursor.col = self.cursor.col.min(cols - 1);
        self.cursor.row = self.cursor.row.min(rows - 1);

        if self.tab_stops.len() < cols {
            let old_len = self.tab_stops.len();
            self.tab_stops.resize(cols, false);
            for i in (old_len..cols).step_by(8) {
                self.tab_stops[i] = true;
            }
        }
    }

    pub fn save_cursor(&mut self) {
        let saved = SavedCursor {
            col: self.cursor.col,
            row: self.cursor.row,
            attr: self.current_attr,
            origin_mode: self.cursor.origin_mode,
            wrap_next: self.cursor.wrap_next,
        };
        if self.is_alt_screen {
            self.saved_cursor_alt = saved;
        } else {
            self.saved_cursor_primary = saved;
        }
    }

    pub fn restore_cursor(&mut self) {
        let saved = if self.is_alt_screen {
            self.saved_cursor_alt
        } else {
            self.saved_cursor_primary
        };
        let cols = self.cols();
        let rows = self.rows();
        self.cursor.col = saved.col.min(cols - 1);
        self.cursor.row = saved.row.min(rows - 1);
        self.current_attr = saved.attr;
        self.cursor.origin_mode = saved.origin_mode;
        self.cursor.wrap_next = saved.wrap_next;
    }

    pub fn set_alt_screen(&mut self, enable: bool, is_1049: bool) {
        if self.is_alt_screen != enable {
            if is_1049 && enable {
                self.save_cursor();
            }
            self.is_alt_screen = enable;
            if enable {
                self.alt_grid.clear_all(self.current_attr);
                if is_1049 {
                    self.cursor.col = 0;
                    self.cursor.row = 0;
                    self.cursor.wrap_next = false;
                }
            } else if is_1049 {
                self.restore_cursor();
            }
            self.grid_mut().mark_all_dirty();
        }
    }

    fn linefeed(&mut self) {
        let bottom = self.grid().scroll_bottom;
        if self.cursor.row == bottom {
            let top = self.grid().scroll_top;
            let attr = self.current_attr;
            self.grid_mut().scroll_up(top, bottom, 1, attr);
        } else if self.cursor.row + 1 < self.rows() {
            self.cursor.row += 1;
        }
        self.cursor.wrap_next = false;
    }

    fn next_tab_stop(&self, from_col: usize) -> usize {
        let cols = self.cols();
        for col in (from_col + 1)..cols {
            if col < self.tab_stops.len() && self.tab_stops[col] {
                return col;
            }
        }
        cols - 1
    }
}

impl Perform for Terminal {
    fn print(&mut self, c: char) {
        let width = UnicodeWidthChar::width(c).unwrap_or(1) as u8;
        if width == 0 {
            return;
        }

        let cols = self.cols();

        if self.cursor.wrap_next {
            if self.autowrap {
                let row = self.cursor.row;
                if let Some(line) = self.grid_mut().line_mut(row) {
                    line.wrapped = true;
                }
                self.linefeed();
                self.cursor.col = 0;
            } else {
                self.cursor.col = cols.saturating_sub(width as usize);
            }
            self.cursor.wrap_next = false;
        }

        if self.cursor.col + (width as usize) > cols {
            if self.autowrap {
                let row = self.cursor.row;
                if let Some(line) = self.grid_mut().line_mut(row) {
                    line.wrapped = true;
                }
                self.linefeed();
                self.cursor.col = 0;
            } else {
                self.cursor.col = cols.saturating_sub(width as usize);
            }
        }

        let row = self.cursor.row;
        let col = self.cursor.col;
        let attr = self.current_attr;

        if let Some(line) = self.grid_mut().line_mut(row) {
            if col < line.cells.len() {
                line.cells[col] = Cell::new(c, width, attr);
                if width == 2 && col + 1 < line.cells.len() {
                    line.cells[col + 1] = Cell::new(' ', 0, attr);
                }
                line.dirty = true;
            }
        }

        if col + (width as usize) >= cols {
            self.cursor.col = cols - 1;
            self.cursor.wrap_next = true;
        } else {
            self.cursor.col += width as usize;
            self.cursor.wrap_next = false;
        }
    }

    fn execute(&mut self, byte: u8) {
        match byte {
            0x07 => {
                self.events.push(TerminalEvent::Bell);
            }
            0x08 => {
                if self.cursor.col > 0 {
                    self.cursor.col -= 1;
                }
                self.cursor.wrap_next = false;
            }
            0x09 => {
                self.cursor.col = self.next_tab_stop(self.cursor.col);
                self.cursor.wrap_next = false;
            }
            0x0A..=0x0C => {
                self.linefeed();
            }
            0x0D => {
                self.cursor.col = 0;
                self.cursor.wrap_next = false;
            }
            _ => {}
        }
    }

    fn hook(&mut self, _params: &Params, _intermediates: &[u8], _ignore: bool, _action: char) {}

    fn put(&mut self, _byte: u8) {}

    fn unhook(&mut self) {}

    fn osc_dispatch(&mut self, params: &[&[u8]], _bell_terminated: bool) {
        handle_osc(params, &mut self.events, &mut self.in_command);
    }

    fn csi_dispatch(&mut self, params: &Params, intermediates: &[u8], _ignore: bool, action: char) {
        let mut flat_params = Vec::new();
        for param in params.iter() {
            flat_params.push(param[0]);
        }

        let param = |idx: usize, default: u16| -> u16 {
            flat_params
                .get(idx)
                .copied()
                .filter(|&v| v != 0)
                .unwrap_or(default)
        };

        let is_private = intermediates.first() == Some(&b'?');
        let cols = self.cols();
        let rows = self.rows();

        match action {
            '@' => {
                // ICH - Insert Characters
                let count = param(0, 1) as usize;
                let row = self.cursor.row;
                let col = self.cursor.col;
                let attr = self.current_attr;
                if let Some(line) = self.grid_mut().line_mut(row) {
                    line.insert_cells(col, count, attr);
                }
            }
            'A' => {
                // CUU - Cursor Up
                let count = param(0, 1) as usize;
                let top = if self.cursor.origin_mode {
                    self.grid().scroll_top
                } else {
                    0
                };
                self.cursor.row = self.cursor.row.saturating_sub(count).max(top);
                self.cursor.wrap_next = false;
            }
            'B' | 'e' => {
                // CUD - Cursor Down
                let count = param(0, 1) as usize;
                let bottom = if self.cursor.origin_mode {
                    self.grid().scroll_bottom
                } else {
                    rows - 1
                };
                self.cursor.row = (self.cursor.row + count).min(bottom);
                self.cursor.wrap_next = false;
            }
            'C' | 'a' => {
                // CUF - Cursor Forward
                let count = param(0, 1) as usize;
                self.cursor.col = (self.cursor.col + count).min(cols - 1);
                self.cursor.wrap_next = false;
            }
            'D' => {
                // CUB - Cursor Back
                let count = param(0, 1) as usize;
                self.cursor.col = self.cursor.col.saturating_sub(count);
                self.cursor.wrap_next = false;
            }
            'E' => {
                // CNL - Cursor Next Line
                let count = param(0, 1) as usize;
                self.cursor.col = 0;
                let bottom = rows - 1;
                self.cursor.row = (self.cursor.row + count).min(bottom);
                self.cursor.wrap_next = false;
            }
            'F' => {
                // CPL - Cursor Previous Line
                let count = param(0, 1) as usize;
                self.cursor.col = 0;
                self.cursor.row = self.cursor.row.saturating_sub(count);
                self.cursor.wrap_next = false;
            }
            'G' | '`' => {
                // CHA - Cursor Horizontal Absolute
                let col = (param(0, 1) as usize).saturating_sub(1);
                self.cursor.col = col.min(cols - 1);
                self.cursor.wrap_next = false;
            }
            'H' | 'f' => {
                // CUP / HVP - Cursor Position
                let row_param = (param(0, 1) as usize).saturating_sub(1);
                let col_param = (param(1, 1) as usize).saturating_sub(1);

                if self.cursor.origin_mode {
                    let top = self.grid().scroll_top;
                    let bottom = self.grid().scroll_bottom;
                    self.cursor.row = (top + row_param).min(bottom);
                } else {
                    self.cursor.row = row_param.min(rows - 1);
                }
                self.cursor.col = col_param.min(cols - 1);
                self.cursor.wrap_next = false;
            }
            'J' => {
                // ED - Erase in Display
                let mode = param(0, 0);
                let attr = self.current_attr;
                let cur_row = self.cursor.row;
                let cur_col = self.cursor.col;

                match mode {
                    0 => {
                        // From cursor to end of screen
                        if let Some(line) = self.grid_mut().line_mut(cur_row) {
                            line.erase_cells(cur_col, cols, attr);
                        }
                        for r in (cur_row + 1)..rows {
                            if let Some(line) = self.grid_mut().line_mut(r) {
                                line.clear(attr);
                            }
                        }
                    }
                    1 => {
                        // From beginning to cursor
                        for r in 0..cur_row {
                            if let Some(line) = self.grid_mut().line_mut(r) {
                                line.clear(attr);
                            }
                        }
                        if let Some(line) = self.grid_mut().line_mut(cur_row) {
                            line.erase_cells(0, cur_col + 1, attr);
                        }
                    }
                    2 => {
                        // Entire screen
                        self.grid_mut().clear_all(attr);
                    }
                    3 => {
                        // Erase scrollback
                        self.primary_grid.clear_scrollback();
                    }
                    _ => {}
                }
            }
            'K' => {
                // EL - Erase in Line
                let mode = param(0, 0);
                let attr = self.current_attr;
                let cur_row = self.cursor.row;
                let cur_col = self.cursor.col;

                if let Some(line) = self.grid_mut().line_mut(cur_row) {
                    match mode {
                        0 => line.erase_cells(cur_col, cols, attr),
                        1 => line.erase_cells(0, cur_col + 1, attr),
                        2 => line.clear(attr),
                        _ => {}
                    }
                }
            }
            'L' => {
                // IL - Insert Lines
                let count = param(0, 1) as usize;
                let cur_row = self.cursor.row;
                let attr = self.current_attr;
                self.grid_mut().insert_lines(cur_row, count, attr);
            }
            'M' => {
                // DL - Delete Lines
                let count = param(0, 1) as usize;
                let cur_row = self.cursor.row;
                let attr = self.current_attr;
                self.grid_mut().delete_lines(cur_row, count, attr);
            }
            'P' => {
                // DCH - Delete Characters
                let count = param(0, 1) as usize;
                let row = self.cursor.row;
                let col = self.cursor.col;
                let attr = self.current_attr;
                if let Some(line) = self.grid_mut().line_mut(row) {
                    line.delete_cells(col, count, attr);
                }
            }
            'S' => {
                // SU - Scroll Up
                let count = param(0, 1) as usize;
                let top = self.grid().scroll_top;
                let bottom = self.grid().scroll_bottom;
                let attr = self.current_attr;
                self.grid_mut().scroll_up(top, bottom, count, attr);
            }
            'T' => {
                // SD - Scroll Down
                let count = param(0, 1) as usize;
                let top = self.grid().scroll_top;
                let bottom = self.grid().scroll_bottom;
                let attr = self.current_attr;
                self.grid_mut().scroll_down(top, bottom, count, attr);
            }
            'X' => {
                // ECH - Erase Characters
                let count = param(0, 1) as usize;
                let row = self.cursor.row;
                let col = self.cursor.col;
                let attr = self.current_attr;
                if let Some(line) = self.grid_mut().line_mut(row) {
                    line.erase_cells(col, col + count, attr);
                }
            }
            'd' => {
                // VPA - Line Position Absolute
                let row = (param(0, 1) as usize).saturating_sub(1);
                self.cursor.row = row.min(rows - 1);
                self.cursor.wrap_next = false;
            }
            'm' => {
                // SGR - Select Graphic Rendition
                let mut iter = flat_params.into_iter();
                if iter.len() == 0 {
                    self.current_attr.reset();
                } else {
                    handle_sgr(&mut iter, &mut self.current_attr);
                }
            }
            'r' => {
                // DECSTBM - Set Top and Bottom Margins
                let top = (param(0, 1) as usize).saturating_sub(1);
                let bottom = (param(1, rows as u16) as usize).saturating_sub(1);
                self.grid_mut().set_margins(top, bottom);
                self.cursor.row = if self.cursor.origin_mode { top } else { 0 };
                self.cursor.col = 0;
                self.cursor.wrap_next = false;
            }
            's' => self.save_cursor(),
            'u' => self.restore_cursor(),
            'h' => {
                // Set Mode
                if is_private {
                    for &p in &flat_params {
                        match p {
                            1 => {}                              // DECCKM - Cursor Keys
                            6 => self.cursor.origin_mode = true, // DECOM
                            7 => self.autowrap = true,           // DECAWM
                            25 => self.cursor.visible = true,    // DECTCEM
                            47 | 1047 => self.set_alt_screen(true, false),
                            1049 => self.set_alt_screen(true, true),
                            2026 => {
                                self.sync_output = true;
                                self.events.push(TerminalEvent::SynchronizedOutput(true));
                            }
                            _ => {}
                        }
                    }
                }
            }
            'l' => {
                // Reset Mode
                if is_private {
                    for &p in &flat_params {
                        match p {
                            1 => {}                               // DECCKM
                            6 => self.cursor.origin_mode = false, // DECOM
                            7 => self.autowrap = false,           // DECAWM
                            25 => self.cursor.visible = false,    // DECTCEM
                            47 | 1047 => self.set_alt_screen(false, false),
                            1049 => self.set_alt_screen(false, true),
                            2026 => {
                                self.sync_output = false;
                                self.events.push(TerminalEvent::SynchronizedOutput(false));
                            }
                            _ => {}
                        }
                    }
                }
            }
            'n' => {
                let code = param(0, 0);
                if code == 5 {
                    self.events
                        .push(TerminalEvent::PtyWrite(b"\x1b[0n".to_vec()));
                } else if code == 6 {
                    let resp = format!("\x1b[{};{}R", self.cursor.row + 1, self.cursor.col + 1);
                    self.events.push(TerminalEvent::PtyWrite(resp.into_bytes()));
                }
            }
            'c' => {
                if is_private || intermediates == b">" {
                    self.events
                        .push(TerminalEvent::PtyWrite(b"\x1b[>0;10;1c".to_vec()));
                } else {
                    self.events
                        .push(TerminalEvent::PtyWrite(b"\x1b[?1;2c".to_vec()));
                }
            }
            'q' if intermediates == b" " => {
                let style = param(0, 1);
                match style {
                    1 | 2 => self.cursor.shape = CursorShape::Block,
                    3 | 4 => self.cursor.shape = CursorShape::Underline,
                    5 | 6 => self.cursor.shape = CursorShape::Bar,
                    _ => {}
                }
                self.cursor.blinking = style % 2 == 1;
            }
            _ => {}
        }
    }

    fn esc_dispatch(&mut self, _intermediates: &[u8], _ignore: bool, byte: u8) {
        match byte {
            b'7' => self.save_cursor(),
            b'8' => self.restore_cursor(),
            b'D' => self.linefeed(),
            b'M' => {
                let top = self.grid().scroll_top;
                if self.cursor.row == top {
                    let bottom = self.grid().scroll_bottom;
                    let attr = self.current_attr;
                    self.grid_mut().scroll_down(top, bottom, 1, attr);
                } else if self.cursor.row > 0 {
                    self.cursor.row -= 1;
                }
                self.cursor.wrap_next = false;
            }
            b'E' => {
                self.cursor.col = 0;
                self.linefeed();
            }
            b'H' => {
                let col = self.cursor.col;
                if col < self.tab_stops.len() {
                    self.tab_stops[col] = true;
                }
            }
            b'c' => {
                let cols = self.cols();
                let rows = self.rows();
                *self = Terminal::new(cols, rows);
            }
            _ => {}
        }
    }
}
