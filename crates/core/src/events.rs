#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PromptMarker {
    A, // Start of prompt
    B, // Command start
    C, // Command executed
    D, // Command finished
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AgentSignalKind {
    Started { agent: String },
    Working,
    Attention,
    Finished,
    Exited,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum TerminalEvent {
    TitleChanged(String),
    CwdChanged(String),
    PromptMarker(PromptMarker),
    CommandState(bool),
    AgentSignal(AgentSignalKind),
    Bell,
    ClipboardWrite(String),
    SynchronizedOutput(bool),
    PtyWrite(Vec<u8>),
}
