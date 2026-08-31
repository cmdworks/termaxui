use crate::cell::{Cell, CellAttributes};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Line {
    pub cells: Vec<Cell>,
    pub wrapped: bool,
    pub dirty: bool,
}

impl Line {
    pub fn new(cols: usize, attr: CellAttributes) -> Self {
        Self {
            cells: vec![Cell::empty(attr); cols],
            wrapped: false,
            dirty: true,
        }
    }

    #[inline(always)]
    pub fn len(&self) -> usize {
        self.cells.len()
    }

    #[inline(always)]
    pub fn is_empty(&self) -> bool {
        self.cells.is_empty()
    }

    pub fn resize(&mut self, new_cols: usize, attr: CellAttributes) {
        let current_len = self.cells.len();
        if new_cols > current_len {
            self.cells.resize(new_cols, Cell::empty(attr));
            self.dirty = true;
        } else if new_cols < current_len {
            self.cells.truncate(new_cols);
            self.dirty = true;
        }
    }

    pub fn clear(&mut self, attr: CellAttributes) {
        for cell in &mut self.cells {
            cell.reset(attr);
        }
        self.wrapped = false;
        self.dirty = true;
    }

    pub fn erase_cells(&mut self, from_col: usize, to_col: usize, attr: CellAttributes) {
        let max_col = to_col.min(self.cells.len());
        for col in from_col..max_col {
            self.cells[col].reset(attr);
        }
        self.dirty = true;
    }

    pub fn insert_cells(&mut self, at_col: usize, count: usize, attr: CellAttributes) {
        let cols = self.cells.len();
        if at_col >= cols || count == 0 {
            return;
        }
        let count = count.min(cols - at_col);
        for col in (at_col..cols - count).rev() {
            self.cells[col + count] = self.cells[col];
        }
        for col in at_col..at_col + count {
            self.cells[col].reset(attr);
        }
        self.dirty = true;
    }

    pub fn delete_cells(&mut self, at_col: usize, count: usize, attr: CellAttributes) {
        let cols = self.cells.len();
        if at_col >= cols || count == 0 {
            return;
        }
        let count = count.min(cols - at_col);
        for col in at_col..cols - count {
            self.cells[col] = self.cells[col + count];
        }
        for col in (cols - count)..cols {
            self.cells[col].reset(attr);
        }
        self.dirty = true;
    }

    pub fn as_text(&self) -> String {
        let mut s = String::new();
        let mut last_non_space = 0;
        for cell in &self.cells {
            if cell.width == 0 {
                continue;
            }
            s.push(cell.c);
            if cell.c != ' ' {
                last_non_space = s.len();
            }
        }
        s.truncate(last_non_space);
        s
    }
}
