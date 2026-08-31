use std::time::Instant;
use termaxui_core::diff::TerminalDiff;
use termaxui_core::Terminal;

#[test]
fn test_parser_and_diff_throughput() {
    let mut term = Terminal::new(80, 24);

    let mut payload = Vec::with_capacity(2_000_000);
    for i in 0..50_000 {
        let line = format!(
            "\x1b[38;2;{};100;200m[Line {:05}]\x1b[0m High throughput terminal test with \x1b[1mbold\x1b[0m and \x1b[4munderline\x1b[0m\r\n",
            i % 256,
            i
        );
        payload.extend_from_slice(line.as_bytes());
    }

    let payload_size_mb = payload.len() as f64 / (1024.0 * 1024.0);

    let start = Instant::now();
    term.process_bytes(&payload);
    let parse_duration = start.elapsed();

    let diff_start = Instant::now();
    let diff = TerminalDiff::compute(&mut term);
    let diff_encoded = diff.encode_binary();
    let diff_duration = diff_start.elapsed();

    let parse_mb_s = payload_size_mb / parse_duration.as_secs_f64();

    println!(
        "\n--- TermaxUI Benchmark ---\n\
        Payload: {:.2} MB (50,000 lines)\n\
        Parse Time: {:?}\n\
        Throughput: {:.2} MB/s\n\
        Diff Compute & Binary Encode: {:?} (encoded size: {} bytes)\n\
        --------------------------\n",
        payload_size_mb,
        parse_duration,
        parse_mb_s,
        diff_duration,
        diff_encoded.len()
    );

    assert!(
        parse_duration.as_millis() < 2000,
        "50k lines should parse within 2 seconds even in unoptimized debug mode"
    );
}
