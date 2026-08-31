import { decodeBinaryDiff } from '../protocol.js';
export class WasmTransport {
    wasmTerminal;
    onDiffCallback;
    constructor(wasmTerminal) {
        this.wasmTerminal = wasmTerminal;
    }
    init(onDiff) {
        this.onDiffCallback = onDiff;
        this.flush();
    }
    sendInput(data) {
        if (typeof data === 'string') {
            this.wasmTerminal.write_str(data);
        }
        else {
            this.wasmTerminal.write_bytes(data);
        }
        this.flush();
    }
    resize(cols, rows) {
        this.wasmTerminal.resize(cols, rows);
        this.flush();
    }
    flush() {
        if (!this.onDiffCallback)
            return;
        const raw = this.wasmTerminal.get_diff_binary();
        if (raw && raw.length > 0) {
            const diff = decodeBinaryDiff(raw);
            this.onDiffCallback(diff);
        }
    }
    dispose() {
        this.onDiffCallback = undefined;
    }
}
