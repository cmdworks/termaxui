import { Terminal } from '../Terminal.js';
import { FitAddon, SearchAddon, SerializeAddon } from '../addons/xterm-compat.js';
export interface TerminalSlot {
    readonly id: number;
    readonly terminal: Terminal;
    readonly fitAddon: FitAddon;
    readonly searchAddon: SearchAddon;
    readonly serializeAddon: SerializeAddon;
    readonly host: HTMLDivElement;
    currentSessionId: string | null;
    lastUsedAt: number;
}
export interface SlotPoolOptions {
    maxSlots?: number;
    scrollbackCap?: number;
}
export declare class TerminalSlotPool {
    private slots;
    private maxSlots;
    private scrollbackCap;
    constructor(options?: SlotPoolOptions);
    acquire(sessionId: string, container: HTMLElement): TerminalSlot;
    park(sessionId: string): void;
    release(sessionId: string): string | null;
    private createSlot;
    private evict;
    dispose(): void;
}
//# sourceMappingURL=SlotPool.d.ts.map