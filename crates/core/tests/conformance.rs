use termaxui_core::cell::CellFlags;
use termaxui_core::color::Color;
use termaxui_core::diff::TerminalDiff;
use termaxui_core::events::{AgentSignalKind, PromptMarker, TerminalEvent};
use termaxui_core::Terminal;

#[test]
fn test_basic_print_and_wrap() {
    let mut term = Terminal::new(10, 5);
    term.process_bytes(b"Hello World!");

    assert_eq!(term.grid().line(0).unwrap().as_text(), "Hello Worl");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "d!");
    assert!(term.grid().line(0).unwrap().wrapped);
    assert_eq!(term.cursor.col, 2);
    assert_eq!(term.cursor.row, 1);
}

#[test]
fn test_control_codes_cr_lf_bs_tab() {
    let mut term = Terminal::new(20, 5);
    term.process_bytes(b"ABC\rDEF");
    assert_eq!(term.grid().line(0).unwrap().as_text(), "DEF");

    term.process_bytes(b"\r\nXYZ\x08K");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "XYK");

    term.process_bytes(b"\r\tTAB");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "XYK     TAB");
}

#[test]
fn test_cursor_movement_and_positioning() {
    let mut term = Terminal::new(20, 10);
    term.process_bytes(b"\x1b[3;5H"); // CUP to row 3, col 5 (1-indexed -> 2, 4)
    assert_eq!(term.cursor.row, 2);
    assert_eq!(term.cursor.col, 4);

    term.process_bytes(b"\x1b[2A"); // CUU up 2 -> row 0
    assert_eq!(term.cursor.row, 0);

    term.process_bytes(b"\x1b[3B"); // CUD down 3 -> row 3
    assert_eq!(term.cursor.row, 3);

    term.process_bytes(b"\x1b[4C"); // CUF right 4 -> col 8
    assert_eq!(term.cursor.col, 8);

    term.process_bytes(b"\x1b[2D"); // CUB left 2 -> col 6
    assert_eq!(term.cursor.col, 6);

    term.process_bytes(b"\x1b[12G"); // CHA col 12 (1-indexed -> col 11)
    assert_eq!(term.cursor.col, 11);

    term.process_bytes(b"\x1b[5d"); // VPA row 5 (1-indexed -> row 4)
    assert_eq!(term.cursor.row, 4);
}

#[test]
fn test_erase_operations() {
    let mut term = Terminal::new(10, 5);
    term.process_bytes(b"0123456789\r\n0123456789\r\n0123456789");

    // EL mode 0 (from cursor to end)
    term.process_bytes(b"\x1b[2;4H\x1b[K");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "012");

    // ED mode 2 (entire display)
    term.process_bytes(b"\x1b[2J");
    assert_eq!(term.grid().line(0).unwrap().as_text(), "");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "");
}

#[test]
fn test_insert_and_delete_lines() {
    let mut term = Terminal::new(10, 5);
    term.process_bytes(b"Line 0\r\nLine 1\r\nLine 2\r\nLine 3\r\nLine 4");

    // Delete Line 1 (row 2 in 1-indexed CUP)
    term.process_bytes(b"\x1b[2;1H\x1b[M");
    assert_eq!(term.grid().line(0).unwrap().as_text(), "Line 0");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "Line 2");
    assert_eq!(term.grid().line(2).unwrap().as_text(), "Line 3");
    assert_eq!(term.grid().line(3).unwrap().as_text(), "Line 4");
    assert_eq!(term.grid().line(4).unwrap().as_text(), "");

    // Insert Line at row 1
    term.process_bytes(b"\x1b[2;1H\x1b[L");
    assert_eq!(term.grid().line(0).unwrap().as_text(), "Line 0");
    assert_eq!(term.grid().line(1).unwrap().as_text(), "");
    assert_eq!(term.grid().line(2).unwrap().as_text(), "Line 2");
}

#[test]
fn test_sgr_colors_and_attributes() {
    let mut term = Terminal::new(20, 5);

    // Bold + Underline + Indexed FG 1 (Red) + 24-bit TrueColor BG (10, 20, 30)
    term.process_bytes(b"\x1b[1;4;31;48;2;10;20;30mX");
    let cell = term.grid().line(0).unwrap().cells[0];
    assert_eq!(cell.c, 'X');
    assert!(cell.flags.contains(CellFlags::BOLD));
    assert!(cell.flags.contains(CellFlags::UNDERLINE));
    assert_eq!(cell.fg, Color::Indexed(1));
    assert_eq!(cell.bg, Color::Rgb(10, 20, 30));

    // Reset SGR
    term.process_bytes(b"\x1b[0mY");
    let cell_y = term.grid().line(0).unwrap().cells[1];
    assert_eq!(cell_y.c, 'Y');
    assert!(cell_y.flags.is_empty());
    assert_eq!(cell_y.fg, Color::Default);
    assert_eq!(cell_y.bg, Color::Default);
}

#[test]
fn test_alternate_screen_buffer() {
    let mut term = Terminal::new(10, 5);
    term.process_bytes(b"Primary");
    assert_eq!(term.grid().line(0).unwrap().as_text(), "Primary");

    // Switch to alternate screen buffer
    term.process_bytes(b"\x1b[?1049hAltBuffer");
    assert!(term.is_alt_screen);
    assert_eq!(term.grid().line(0).unwrap().as_text(), "AltBuffer");

    // Switch back to primary
    term.process_bytes(b"\x1b[?1049l");
    assert!(!term.is_alt_screen);
    assert_eq!(term.grid().line(0).unwrap().as_text(), "Primary");
}

#[test]
fn test_shell_integration_and_agent_signals() {
    let mut term = Terminal::new(40, 10);

    // OSC 133 A (start of prompt)
    term.process_bytes(b"\x1b]133;A\x07");
    // OSC 7 (cwd)
    term.process_bytes(b"\x1b]7;file://localhost/Users/as/project\x07");
    // OSC 133 B (command start)
    term.process_bytes(b"\x1b]133;B\x07");
    // OSC 777 (agent signal)
    term.process_bytes(b"\x1b]777;notify;Termax;working\x07");
    // OSC 133 D (command exit)
    term.process_bytes(b"\x1b]133;D\x07");

    let events = term.drain_events();
    assert!(events.contains(&TerminalEvent::PromptMarker(PromptMarker::A)));
    assert!(events.contains(&TerminalEvent::CwdChanged("/Users/as/project".to_string())));
    assert!(events.contains(&TerminalEvent::PromptMarker(PromptMarker::B)));
    assert!(events.contains(&TerminalEvent::AgentSignal(AgentSignalKind::Working)));
    assert!(events.contains(&TerminalEvent::PromptMarker(PromptMarker::D)));
}

#[test]
fn test_queries_da_and_cpr() {
    let mut term = Terminal::new(20, 10);
    term.process_bytes(b"\x1b[3;7H\x1b[6n"); // Cursor to 3, 7 then CPR query
    let events = term.drain_events();
    assert_eq!(events, vec![TerminalEvent::PtyWrite(b"\x1b[3;7R".to_vec())]);

    term.process_bytes(b"\x1b[c"); // Primary DA
    let events = term.drain_events();
    assert_eq!(
        events,
        vec![TerminalEvent::PtyWrite(b"\x1b[?1;2c".to_vec())]
    );
}

#[test]
fn test_dirty_row_diff_and_binary_encoding() {
    let mut term = Terminal::new(10, 3);
    term.process_bytes(b"Hello");

    let diff = TerminalDiff::compute(&mut term);
    assert_eq!(diff.cols, 10);
    assert_eq!(diff.rows, 3);
    assert_eq!(diff.cursor_x, 5);
    assert_eq!(diff.cursor_y, 0);
    assert_eq!(diff.dirty_rows.len(), 3); // Initial compute has all 3 rows

    let encoded = diff.encode_binary();
    assert!(encoded.starts_with(b"TMX1"));

    // Next compute with no changes has 0 dirty rows
    let diff2 = TerminalDiff::compute(&mut term);
    assert_eq!(diff2.dirty_rows.len(), 0);
}
