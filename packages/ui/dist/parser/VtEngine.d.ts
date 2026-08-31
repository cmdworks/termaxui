import { CursorState, TerminalCell, TerminalDiff } from '../types.js';
export interface VtEvents {
    onTitle?: (title: string) => void;
    onCwd?: (cwd: string) => void;
    onBell?: () => void;
    onOsc?: (ident: number, data: string) => void;
}
export declare class VtEngine {
    cols: number;
    rows: number;
    maxScrollback: number;
    lines: TerminalCell[][];
    scrollback: TerminalCell[][];
    viewportY: number;
    cursor: CursorState;
    private savedCursor;
    private scrollTop;
    private scrollBottom;
    private currentFg;
    private currentBg;
    private currentFlags;
    private dirtyRowSet;
    private events;
    private state;
    private csiParams;
    private oscBuffer;
    constructor(cols?: number, rows?: number, events?: VtEvents);
    resize(cols: number, rows: number): void;
    scrollLines(delta: number): void;
    scrollToBottom(): void;
    scrollToTop(): void;
    scrollToLine(line: number): void;
    getVisibleLines(): TerminalCell[][];
    private initGrid;
    private createEmptyLine;
    feed(data: string | Uint8Array): TerminalDiff;
    private printChar;
    private lineFeed;
    private scrollUp;
    private handleCsi;
    private handleSgr;
    private handleOsc;
    private clearLine;
    private clearLineRange;
    reset(): void;
}
//# sourceMappingURL=VtEngine.d.ts.map