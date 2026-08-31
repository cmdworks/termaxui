import { decodeBinaryDiff } from '../protocol.js';
import { TerminalDiff, TerminalTransport } from '../types.js';

export interface IWasmTerminal {
  write_str(data: string): void;
  write_bytes(data: Uint8Array): void;
  resize(cols: number, rows: number): void;
  get_diff_binary(): Uint8Array;
}

export class WasmTransport implements TerminalTransport {
  private wasmTerminal: IWasmTerminal;
  private onDiffCallback?: (diff: TerminalDiff) => void;

  constructor(wasmTerminal: IWasmTerminal) {
    this.wasmTerminal = wasmTerminal;
  }

  public init(onDiff: (diff: TerminalDiff) => void): void {
    this.onDiffCallback = onDiff;
    this.flush();
  }

  public sendInput(data: string | Uint8Array): void {
    if (typeof data === 'string') {
      this.wasmTerminal.write_str(data);
    } else {
      this.wasmTerminal.write_bytes(data);
    }
    this.flush();
  }

  public resize(cols: number, rows: number): void {
    this.wasmTerminal.resize(cols, rows);
    this.flush();
  }

  public flush(): void {
    if (!this.onDiffCallback) return;
    const raw = this.wasmTerminal.get_diff_binary();
    if (raw && raw.length > 0) {
      const diff = decodeBinaryDiff(raw);
      this.onDiffCallback(diff);
    }
  }

  public dispose(): void {
    this.onDiffCallback = undefined;
  }
}
