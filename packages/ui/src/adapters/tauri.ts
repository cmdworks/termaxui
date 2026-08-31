import { decodeBinaryDiff } from '../protocol.js';
import { TerminalDiff, TerminalTransport } from '../types.js';

export interface TauriChannelOptions {
  sendInput: (data: string | Uint8Array) => void;
  sendResize: (cols: number, rows: number) => void;
  subscribeDiffs: (callback: (rawPayload: Uint8Array | ArrayBuffer) => void) => () => void;
}

export class TauriTransport implements TerminalTransport {
  private options: TauriChannelOptions;
  private unsubscribe?: () => void;

  constructor(options: TauriChannelOptions) {
    this.options = options;
  }

  public init(onDiff: (diff: TerminalDiff) => void, onEvent?: (event: any) => void): void {
    this.unsubscribe = this.options.subscribeDiffs((rawPayload) => {
      try {
        const diff = decodeBinaryDiff(rawPayload);
        onDiff(diff);
      } catch (err) {
        console.error('[TauriTransport] Failed to decode diff:', err);
      }
    });
  }

  public sendInput(data: string | Uint8Array): void {
    this.options.sendInput(data);
  }

  public resize(cols: number, rows: number): void {
    this.options.sendResize(cols, rows);
  }

  public dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}
