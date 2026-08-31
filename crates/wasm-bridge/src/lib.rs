//! termaxui-wasm: wasm-bindgen exports, xterm.js-compatible API surface.

use termaxui_core::diff::TerminalDiff;
use termaxui_core::Terminal;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmTerminal {
    terminal: Terminal,
}

#[wasm_bindgen]
impl WasmTerminal {
    #[wasm_bindgen(constructor)]
    pub fn new(cols: u32, rows: u32) -> Self {
        Self {
            terminal: Terminal::new(cols as usize, rows as usize),
        }
    }

    #[wasm_bindgen]
    pub fn write_str(&mut self, data: &str) {
        self.terminal.process_bytes(data.as_bytes());
    }

    #[wasm_bindgen]
    pub fn write_bytes(&mut self, data: &[u8]) {
        self.terminal.process_bytes(data);
    }

    #[wasm_bindgen]
    pub fn resize(&mut self, cols: u32, rows: u32) {
        self.terminal.resize(cols as usize, rows as usize);
    }

    #[wasm_bindgen]
    pub fn get_diff_binary(&mut self) -> Vec<u8> {
        let diff = TerminalDiff::compute(&mut self.terminal);
        diff.encode_binary()
    }

    #[wasm_bindgen]
    pub fn get_line_text(&self, row: u32) -> String {
        self.terminal
            .grid()
            .line(row as usize)
            .map(|l| l.as_text())
            .unwrap_or_default()
    }

    #[wasm_bindgen]
    pub fn cols(&self) -> u32 {
        self.terminal.cols() as u32
    }

    #[wasm_bindgen]
    pub fn rows(&self) -> u32 {
        self.terminal.rows() as u32
    }

    #[wasm_bindgen]
    pub fn cursor_x(&self) -> u32 {
        self.terminal.cursor.col as u32
    }

    #[wasm_bindgen]
    pub fn cursor_y(&self) -> u32 {
        self.terminal.cursor.row as u32
    }

    #[wasm_bindgen]
    pub fn is_cursor_visible(&self) -> bool {
        self.terminal.cursor.visible
    }

    #[wasm_bindgen]
    pub fn is_alt_screen(&self) -> bool {
        self.terminal.is_alt_screen
    }
}
