import { TerminalDiff, TerminalTransport } from '../types.js';
export interface IWasmTerminal {
    write_str(data: string): void;
    write_bytes(data: Uint8Array): void;
    resize(cols: number, rows: number): void;
    get_diff_binary(): Uint8Array;
}
export declare class WasmTransport implements TerminalTransport {
    private wasmTerminal;
    private onDiffCallback?;
    constructor(wasmTerminal: IWasmTerminal);
    init(onDiff: (diff: TerminalDiff) => void): void;
    sendInput(data: string | Uint8Array): void;
    resize(cols: number, rows: number): void;
    flush(): void;
    dispose(): void;
}
//# sourceMappingURL=web.d.ts.map