export class ShellStateManager {
    terminal;
    state = 'prompt';
    cwd = null;
    listeners = [];
    disposers = [];
    constructor(terminal) {
        this.terminal = terminal;
        this.setupOscHandlers();
    }
    addListener(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    getCwd() {
        return this.cwd;
    }
    getState() {
        return this.state;
    }
    setupOscHandlers() {
        // OSC 7: Current Working Directory (file://hostname/path)
        const osc7 = this.terminal.parser.registerOscHandler(7, (data) => {
            try {
                let path = data;
                if (path.startsWith('file://')) {
                    const url = new URL(path);
                    path = decodeURIComponent(url.pathname);
                }
                if (path && path !== this.cwd) {
                    this.cwd = path;
                    for (const l of this.listeners)
                        l.onCwdChange?.(path);
                }
            }
            catch {
                // Fallback for non-standard URI strings
                const slashIdx = data.indexOf('/');
                if (slashIdx !== -1) {
                    const path = data.slice(slashIdx);
                    this.cwd = path;
                    for (const l of this.listeners)
                        l.onCwdChange?.(path);
                }
            }
            return true;
        });
        // OSC 133: Semantic Prompt Markers
        // A = Prompt Start, B = Prompt End / Command Input, C = Command Executed, D = Command Finished
        const osc133 = this.terminal.parser.registerOscHandler(133, (data) => {
            const marker = data.charAt(0);
            if (marker === 'A') {
                this.state = 'prompt';
                for (const l of this.listeners)
                    l.onStateChange?.('prompt');
            }
            else if (marker === 'B') {
                this.state = 'command';
                for (const l of this.listeners)
                    l.onStateChange?.('command');
            }
            else if (marker === 'C') {
                this.state = 'executed';
                for (const l of this.listeners) {
                    l.onStateChange?.('executed');
                    l.onCommandStart?.();
                }
            }
            else if (marker === 'D') {
                this.state = 'finished';
                const exitCode = parseInt(data.slice(1).trim(), 10) || 0;
                for (const l of this.listeners) {
                    l.onStateChange?.('finished');
                    l.onCommandFinish?.(exitCode);
                }
            }
            return true;
        });
        this.disposers.push(() => osc7.dispose(), () => osc133.dispose());
    }
    dispose() {
        for (const d of this.disposers)
            d();
        this.disposers = [];
        this.listeners = [];
    }
}
