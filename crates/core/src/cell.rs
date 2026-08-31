use crate::color::Color;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default, Hash)]
pub struct CellFlags(pub u16);

impl CellFlags {
    pub const EMPTY: Self = Self(0);
    pub const BOLD: Self = Self(1 << 0);
    pub const DIM: Self = Self(1 << 1);
    pub const ITALIC: Self = Self(1 << 2);
    pub const UNDERLINE: Self = Self(1 << 3);
    pub const BLINK: Self = Self(1 << 4);
    pub const INVERSE: Self = Self(1 << 5);
    pub const HIDDEN: Self = Self(1 << 6);
    pub const STRIKETHROUGH: Self = Self(1 << 7);

    #[inline(always)]
    pub fn contains(&self, other: Self) -> bool {
        (self.0 & other.0) == other.0
    }

    #[inline(always)]
    pub fn insert(&mut self, other: Self) {
        self.0 |= other.0;
    }

    #[inline(always)]
    pub fn remove(&mut self, other: Self) {
        self.0 &= !other.0;
    }

    #[inline(always)]
    pub fn is_empty(&self) -> bool {
        self.0 == 0
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub struct CellAttributes {
    pub fg: Color,
    pub bg: Color,
    pub flags: CellFlags,
}

impl CellAttributes {
    pub fn reset(&mut self) {
        self.fg = Color::Default;
        self.bg = Color::Default;
        self.flags = CellFlags::EMPTY;
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Cell {
    pub c: char,
    pub fg: Color,
    pub bg: Color,
    pub flags: CellFlags,
    pub width: u8,
}

impl Default for Cell {
    fn default() -> Self {
        Self::empty(CellAttributes::default())
    }
}

impl Cell {
    #[inline(always)]
    pub fn empty(attr: CellAttributes) -> Self {
        Self {
            c: ' ',
            fg: attr.fg,
            bg: attr.bg,
            flags: attr.flags,
            width: 1,
        }
    }

    #[inline(always)]
    pub fn new(c: char, width: u8, attr: CellAttributes) -> Self {
        Self {
            c,
            fg: attr.fg,
            bg: attr.bg,
            flags: attr.flags,
            width,
        }
    }

    #[inline(always)]
    pub fn is_empty(&self) -> bool {
        self.c == ' ' && self.bg == Color::Default && self.flags.is_empty()
    }

    #[inline(always)]
    pub fn reset(&mut self, attr: CellAttributes) {
        self.c = ' ';
        self.fg = attr.fg;
        self.bg = attr.bg;
        self.flags = attr.flags;
        self.width = 1;
    }
}
