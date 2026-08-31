import { TerminalSlotPool, SlotPoolOptions } from './SlotPool.js';
import { DormantRing } from './DormantRing.js';
import { ShellStateManager } from './ShellStateManager.js';
import { GhostTextManager } from './GhostTextManager.js';
export interface TerminalSessionOptions {
    id: string;
    initialCwd?: string;
    onData?: (bytes: Uint8Array) => void;
    onCwdChange?: (cwd: string) => void;
}
export declare class TerminalSession {
    readonly id: string;
    readonly dormantRing: DormantRing;
    shellState: ShellStateManager | null;
    ghostText: GhostTextManager | null;
    private onDataCallback?;
    private onCwdCallback?;
    constructor(options: TerminalSessionOptions);
    write(data: string | Uint8Array): void;
    setCwd(cwd: string): void;
}
export interface TerminalRuntimeOptions extends SlotPoolOptions {
    enableAiGhostText?: boolean;
}
export declare class TerminalRuntime {
    readonly slotPool: TerminalSlotPool;
    private sessions;
    private options;
    constructor(options?: TerminalRuntimeOptions);
    createSession(options: TerminalSessionOptions): TerminalSession;
    getSession(id: string): TerminalSession | undefined;
    mountSession(sessionId: string, container: HTMLElement): import("./SlotPool.js").TerminalSlot;
    parkSession(sessionId: string): void;
    disposeSession(sessionId: string): void;
    dispose(): void;
}
export declare function createTerminalRuntime(options?: TerminalRuntimeOptions): TerminalRuntime;
//# sourceMappingURL=Runtime.d.ts.map