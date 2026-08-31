import { Terminal } from '../Terminal.js';
export type ShellState = 'prompt' | 'command' | 'executed' | 'finished';
export interface ShellStateListener {
    onCwdChange?: (cwd: string) => void;
    onStateChange?: (state: ShellState) => void;
    onCommandStart?: (commandLine?: string) => void;
    onCommandFinish?: (exitCode: number) => void;
}
export declare class ShellStateManager {
    private terminal;
    private state;
    private cwd;
    private listeners;
    private disposers;
    constructor(terminal: Terminal);
    addListener(listener: ShellStateListener): () => void;
    getCwd(): string | null;
    getState(): ShellState;
    private setupOscHandlers;
    dispose(): void;
}
//# sourceMappingURL=ShellStateManager.d.ts.map