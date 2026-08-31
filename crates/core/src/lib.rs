//! termaxui-core: platform-agnostic VT parser, grid, and dirty-row diff engine.

pub mod cell;
pub mod color;
pub mod cursor;
pub mod diff;
pub mod events;
pub mod grid;
pub mod line;
pub mod osc;
pub mod sgr;
pub mod terminal;

pub use cell::{Cell, CellAttributes, CellFlags};
pub use color::Color;
pub use cursor::{Cursor, CursorShape, SavedCursor};
pub use diff::{DirtyRow, TerminalDiff};
pub use events::{AgentSignalKind, PromptMarker, TerminalEvent};
pub use grid::Grid;
pub use line::Line;
pub use terminal::Terminal;
