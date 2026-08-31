use crate::cell::CellAttributes;
use crate::line::Line;

pub const DEFAULT_MAX_SCROLLBACK: usize = 10_000;

#[derive(Clone, Debug)]
pub struct Grid {
    pub cols: usize,
    pub rows: usize,
    pub max_scrollback: usize,
    pub lines: Vec<Line>,
    pub scrollback: Vec<Line>,
    pub scroll_top: usize,
    pub scroll_bottom: usize,
    pub dirty_all: bool,
}

impl Grid {
    pub fn new(cols: usize, rows: usize, max_scrollback: usize, attr: CellAttributes) -> Self {
        let cols = cols.max(1);
        let rows = rows.max(1);
        let lines = (0..rows).map(|_| Line::new(cols, attr)).collect();
        Self {
            cols,
            rows,
            max_scrollback,
            lines,
            scrollback: Vec::new(),
            scroll_top: 0,
            scroll_bottom: rows - 1,
            dirty_all: true,
        }
    }

    #[inline(always)]
    pub fn line(&self, row: usize) -> Option<&Line> {
        self.lines.get(row)
    }

    #[inline(always)]
    pub fn line_mut(&mut self, row: usize) -> Option<&mut Line> {
        self.lines.get_mut(row)
    }

    pub fn set_margins(&mut self, top: usize, bottom: usize) {
        let top = top.min(self.rows.saturating_sub(1));
        let bottom = bottom.min(self.rows.saturating_sub(1));
        if top < bottom {
            self.scroll_top = top;
            self.scroll_bottom = bottom;
        } else {
            self.scroll_top = 0;
            self.scroll_bottom = self.rows.saturating_sub(1);
        }
    }

    pub fn scroll_up(&mut self, top: usize, bottom: usize, count: usize, attr: CellAttributes) {
        if top >= bottom || count == 0 || bottom >= self.rows {
            return;
        }
        let count = count.min(bottom - top + 1);
        let is_full_scroll = top == 0 && bottom == self.rows - 1;

        if is_full_scroll && self.max_scrollback > 0 {
            for i in 0..count {
                let mut scrolled_line = self.lines[i].clone();
                scrolled_line.dirty = false;
                if self.scrollback.len() >= self.max_scrollback {
                    self.scrollback.remove(0);
                }
                self.scrollback.push(scrolled_line);
            }
        }

        // In-place rotation: zero vector allocations
        self.lines[top..=bottom].rotate_left(count);

        for i in (bottom - count + 1)..=bottom {
            self.lines[i].clear(attr);
        }
        for i in top..=bottom {
            self.lines[i].dirty = true;
        }
    }

    pub fn scroll_down(&mut self, top: usize, bottom: usize, count: usize, attr: CellAttributes) {
        if top >= bottom || count == 0 || bottom >= self.rows {
            return;
        }
        let count = count.min(bottom - top + 1);

        // In-place rotation: zero vector allocations
        self.lines[top..=bottom].rotate_right(count);

        for i in top..(top + count) {
            self.lines[i].clear(attr);
        }
        for i in top..=bottom {
            self.lines[i].dirty = true;
        }
    }

    pub fn insert_lines(&mut self, at_row: usize, count: usize, attr: CellAttributes) {
        if at_row < self.scroll_top || at_row > self.scroll_bottom {
            return;
        }
        self.scroll_down(at_row, self.scroll_bottom, count, attr);
    }

    pub fn delete_lines(&mut self, at_row: usize, count: usize, attr: CellAttributes) {
        if at_row < self.scroll_top || at_row > self.scroll_bottom {
            return;
        }
        self.scroll_up(at_row, self.scroll_bottom, count, attr);
    }

    pub fn clear_all(&mut self, attr: CellAttributes) {
        for line in &mut self.lines {
            line.clear(attr);
        }
        self.dirty_all = true;
    }

    pub fn clear_scrollback(&mut self) {
        self.scrollback.clear();
    }

    pub fn resize(&mut self, new_cols: usize, new_rows: usize, attr: CellAttributes) {
        let new_cols = new_cols.max(1);
        let new_rows = new_rows.max(1);

        for line in &mut self.lines {
            line.resize(new_cols, attr);
        }

        if new_rows > self.rows {
            for _ in self.rows..new_rows {
                self.lines.push(Line::new(new_cols, attr));
            }
        } else if new_rows < self.rows {
            let remove_count = self.rows - new_rows;
            for _ in 0..remove_count {
                if !self.lines.is_empty() {
                    let removed = self.lines.remove(0);
                    if self.max_scrollback > 0 {
                        if self.scrollback.len() >= self.max_scrollback {
                            self.scrollback.remove(0);
                        }
                        self.scrollback.push(removed);
                    }
                }
            }
        }

        self.cols = new_cols;
        self.rows = new_rows;
        self.scroll_top = 0;
        self.scroll_bottom = new_rows.saturating_sub(1);
        self.dirty_all = true;
    }

    pub fn mark_all_dirty(&mut self) {
        self.dirty_all = true;
        for line in &mut self.lines {
            line.dirty = true;
        }
    }

    pub fn clear_dirty(&mut self) {
        self.dirty_all = false;
        for line in &mut self.lines {
            line.dirty = false;
        }
    }
}
