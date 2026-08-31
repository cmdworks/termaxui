use crate::events::{AgentSignalKind, PromptMarker, TerminalEvent};

pub fn handle_osc(params: &[&[u8]], events: &mut Vec<TerminalEvent>, in_command: &mut bool) {
    if params.is_empty() {
        return;
    }

    let code = match std::str::from_utf8(params[0])
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
    {
        Some(c) => c,
        None => return,
    };

    match code {
        0 | 2 => {
            // Window Title
            if params.len() > 1 {
                if let Ok(title) = std::str::from_utf8(params[1]) {
                    events.push(TerminalEvent::TitleChanged(title.to_string()));
                }
            }
        }
        7 => {
            // OSC 7 CWD: file://hostname/path
            if *in_command {
                return;
            }
            if params.len() > 1 {
                if let Ok(raw) = std::str::from_utf8(params[1]) {
                    if let Some(cwd) = parse_osc7(raw) {
                        events.push(TerminalEvent::CwdChanged(cwd));
                    }
                }
            }
        }
        133 => {
            // Shell Integration: A, B, C, D
            if params.len() > 1 {
                if let Ok(data) = std::str::from_utf8(params[1]) {
                    if data.starts_with('A') {
                        *in_command = false;
                        events.push(TerminalEvent::CommandState(false));
                        events.push(TerminalEvent::PromptMarker(PromptMarker::A));
                    } else if data.starts_with('B') {
                        *in_command = true;
                        events.push(TerminalEvent::CommandState(true));
                        events.push(TerminalEvent::PromptMarker(PromptMarker::B));
                    } else if data.starts_with('C') {
                        *in_command = true;
                        events.push(TerminalEvent::CommandState(true));
                        events.push(TerminalEvent::PromptMarker(PromptMarker::C));
                    } else if data.starts_with('D') {
                        *in_command = false;
                        events.push(TerminalEvent::CommandState(false));
                        events.push(TerminalEvent::PromptMarker(PromptMarker::D));
                    }
                }
            }
        }
        777 => {
            // Agent notifications: 777;notify;Termax;working | 777;notify;...
            let p1 = params
                .get(1)
                .and_then(|p| std::str::from_utf8(p).ok())
                .unwrap_or("");
            let p2 = params
                .get(2)
                .and_then(|p| std::str::from_utf8(p).ok())
                .unwrap_or("");
            let p3 = params
                .get(3)
                .and_then(|p| std::str::from_utf8(p).ok())
                .unwrap_or("");

            if p1 == "notify" && p2 == "Termax" {
                match p3 {
                    "working" => events.push(TerminalEvent::AgentSignal(AgentSignalKind::Working)),
                    "attention" => {
                        events.push(TerminalEvent::AgentSignal(AgentSignalKind::Attention))
                    }
                    "finished" => {
                        events.push(TerminalEvent::AgentSignal(AgentSignalKind::Finished))
                    }
                    _ => events.push(TerminalEvent::AgentSignal(AgentSignalKind::Attention)),
                }
            } else if let Some(action) = p1.strip_prefix("notify;Termax;") {
                match action {
                    "working" => events.push(TerminalEvent::AgentSignal(AgentSignalKind::Working)),
                    "attention" => {
                        events.push(TerminalEvent::AgentSignal(AgentSignalKind::Attention))
                    }
                    "finished" => {
                        events.push(TerminalEvent::AgentSignal(AgentSignalKind::Finished))
                    }
                    _ => events.push(TerminalEvent::AgentSignal(AgentSignalKind::Attention)),
                }
            } else if p1 == "notify" || p1.starts_with("notify;") {
                events.push(TerminalEvent::AgentSignal(AgentSignalKind::Attention));
            }
        }
        9 | 99 => {
            events.push(TerminalEvent::AgentSignal(AgentSignalKind::Attention));
        }
        52 if params.len() > 2 => {
            if let Ok(b64) = std::str::from_utf8(params[2]) {
                events.push(TerminalEvent::ClipboardWrite(b64.to_string()));
            }
        }
        _ => {}
    }
}

fn parse_osc7(data: &str) -> Option<String> {
    let prefix = "file://";
    if !data.starts_with(prefix) {
        return None;
    }
    let rest = &data[prefix.len()..];
    let path_start = rest.find('/')?;
    let raw_path = &rest[path_start..];

    let decoded = url_decode(raw_path);
    let path = if decoded.len() >= 3 && decoded.starts_with('/') && decoded.as_bytes()[2] == b':' {
        decoded[1..].to_string()
    } else {
        decoded
    };

    Some(path)
}

fn url_decode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(byte as char);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}
