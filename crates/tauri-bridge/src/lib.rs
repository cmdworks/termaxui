//! termaxui-tauri: Tauri Channel emitter, PTY glue, native-only bridge.

use std::sync::Mutex;
use termaxui_core::diff::TerminalDiff;
use termaxui_core::events::TerminalEvent;
use termaxui_core::Terminal;

#[derive(Debug)]
pub struct NativeTerminalSession {
    terminal: Mutex<Terminal>,
}

impl NativeTerminalSession {
    pub fn new(cols: usize, rows: usize) -> Self {
        Self {
            terminal: Mutex::new(Terminal::new(cols, rows)),
        }
    }

    pub fn with_scrollback(cols: usize, rows: usize, max_scrollback: usize) -> Self {
        Self {
            terminal: Mutex::new(Terminal::with_scrollback(cols, rows, max_scrollback)),
        }
    }

    /// Feed raw PTY output bytes into the terminal and compute the diff payload + events.
    pub fn feed_bytes(&self, bytes: &[u8]) -> (Vec<u8>, Vec<TerminalEvent>) {
        let mut term = self.terminal.lock().unwrap();
        term.process_bytes(bytes);
        let events = term.drain_events();
        let diff = TerminalDiff::compute(&mut term);
        let binary_diff = diff.encode_binary();
        (binary_diff, events)
    }

    /// Resize terminal and produce a complete refresh diff payload.
    pub fn resize(&self, cols: usize, rows: usize) -> Vec<u8> {
        let mut term = self.terminal.lock().unwrap();
        term.resize(cols, rows);
        let diff = TerminalDiff::compute(&mut term);
        diff.encode_binary()
    }

    /// Get current diff payload.
    pub fn get_diff(&self) -> Vec<u8> {
        let mut term = self.terminal.lock().unwrap();
        let diff = TerminalDiff::compute(&mut term);
        diff.encode_binary()
    }

    /// Drain accumulated events.
    pub fn drain_events(&self) -> Vec<TerminalEvent> {
        let mut term = self.terminal.lock().unwrap();
        term.drain_events()
    }
}
