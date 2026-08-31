import { TerminalDiff, TerminalTransport } from '../types.js';
export interface TauriChannelOptions {
    sendInput: (data: string | Uint8Array) => void;
    sendResize: (cols: number, rows: number) => void;
    subscribeDiffs: (callback: (rawPayload: Uint8Array | ArrayBuffer) => void) => () => void;
}
export declare class TauriTransport implements TerminalTransport {
    private options;
    private unsubscribe?;
    constructor(options: TauriChannelOptions);
    init(onDiff: (diff: TerminalDiff) => void, onEvent?: (event: any) => void): void;
    sendInput(data: string | Uint8Array): void;
    resize(cols: number, rows: number): void;
    dispose(): void;
}
//# sourceMappingURL=tauri.d.ts.map