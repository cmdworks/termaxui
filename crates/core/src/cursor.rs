use crate::cell::CellAttributes;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum CursorShape {
    #[default]
    Block,
    Underline,
    Bar,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Cursor {
    pub col: usize,
    pub row: usize,
    pub visible: bool,
    pub shape: CursorShape,
    pub blinking: bool,
    pub wrap_next: bool,
    pub origin_mode: bool,
}

impl Default for Cursor {
    fn default() -> Self {
        Self {
            col: 0,
            row: 0,
            visible: true,
            shape: CursorShape::Block,
            blinking: true,
            wrap_next: false,
            origin_mode: false,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub struct SavedCursor {
    pub col: usize,
    pub row: usize,
    pub attr: CellAttributes,
    pub origin_mode: bool,
    pub wrap_next: bool,
}
