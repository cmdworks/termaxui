use crate::cell::Cell;
use crate::cursor::CursorShape;
use crate::terminal::Terminal;

#[derive(Clone, Debug)]
pub struct DirtyRow {
    pub row: usize,
    pub cells: Vec<Cell>,
}

#[derive(Clone, Debug)]
pub struct TerminalDiff {
    pub cols: usize,
    pub rows: usize,
    pub cursor_x: usize,
    pub cursor_y: usize,
    pub cursor_visible: bool,
    pub cursor_shape: CursorShape,
    pub cursor_blinking: bool,
    pub dirty_rows: Vec<DirtyRow>,
}

impl TerminalDiff {
    pub fn compute(terminal: &mut Terminal) -> Self {
        let cols = terminal.cols();
        let rows = terminal.rows();
        let cursor = terminal.cursor;

        let mut dirty_rows = Vec::new();
        let grid = terminal.grid_mut();

        for (r, line) in grid.lines.iter_mut().enumerate() {
            if line.dirty || grid.dirty_all {
                dirty_rows.push(DirtyRow {
                    row: r,
                    cells: line.cells.clone(),
                });
                line.dirty = false;
            }
        }
        grid.dirty_all = false;

        Self {
            cols,
            rows,
            cursor_x: cursor.col,
            cursor_y: cursor.row,
            cursor_visible: cursor.visible,
            cursor_shape: cursor.shape,
            cursor_blinking: cursor.blinking,
            dirty_rows,
        }
    }

    /// Binary format v1:
    /// [0..4]   Magic b"TMX1"
    /// [4..6]   cols (u16 LE)
    /// [6..8]   rows (u16 LE)
    /// [8..10]  cursor_x (u16 LE)
    /// [10..12] cursor_y (u16 LE)
    /// [12]     flags (bit 0: visible, bit 1: blinking, bits 2..4: shape)
    /// [13..15] num_dirty_rows (u16 LE)
    /// Per dirty row:
    ///   [0..2] row_idx (u16 LE)
    ///   Per cell:
    ///     [0..4]  char codepoint (u32 LE)
    ///     [4]     width (u8)
    ///     [5..7]  flags (u16 LE)
    ///     [7]     fg type (0: Default, 1: Indexed, 2: RGB)
    ///     [8..11] fg value (1 byte index or 3 bytes RGB)
    ///     [11]    bg type (0: Default, 1: Indexed, 2: RGB)
    ///     [12..15] bg value
    pub fn encode_binary(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(32 + self.dirty_rows.len() * (self.cols * 16 + 2));
        buf.extend_from_slice(b"TMX1");
        buf.extend_from_slice(&(self.cols as u16).to_le_bytes());
        buf.extend_from_slice(&(self.rows as u16).to_le_bytes());
        buf.extend_from_slice(&(self.cursor_x as u16).to_le_bytes());
        buf.extend_from_slice(&(self.cursor_y as u16).to_le_bytes());

        let mut flags: u8 = 0;
        if self.cursor_visible {
            flags |= 1 << 0;
        }
        if self.cursor_blinking {
            flags |= 1 << 1;
        }
        let shape_val = match self.cursor_shape {
            CursorShape::Block => 0,
            CursorShape::Underline => 1,
            CursorShape::Bar => 2,
        };
        flags |= (shape_val & 0x07) << 2;
        buf.push(flags);

        buf.extend_from_slice(&(self.dirty_rows.len() as u16).to_le_bytes());

        for dirty_row in &self.dirty_rows {
            buf.extend_from_slice(&(dirty_row.row as u16).to_le_bytes());
            for cell in &dirty_row.cells {
                buf.extend_from_slice(&(cell.c as u32).to_le_bytes());
                buf.push(cell.width);
                buf.extend_from_slice(&cell.flags.0.to_le_bytes());

                encode_color(&cell.fg, &mut buf);
                encode_color(&cell.bg, &mut buf);
            }
        }

        buf
    }
}

fn encode_color(color: &crate::color::Color, buf: &mut Vec<u8>) {
    match color {
        crate::color::Color::Default => {
            buf.push(0);
            buf.extend_from_slice(&[0, 0, 0]);
        }
        crate::color::Color::Indexed(idx) => {
            buf.push(1);
            buf.push(*idx);
            buf.extend_from_slice(&[0, 0]);
        }
        crate::color::Color::Rgb(r, g, b) => {
            buf.push(2);
            buf.push(*r);
            buf.push(*g);
            buf.push(*b);
        }
    }
}
