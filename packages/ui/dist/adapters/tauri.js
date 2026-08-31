import { decodeBinaryDiff } from '../protocol.js';
export class TauriTransport {
    options;
    unsubscribe;
    constructor(options) {
        this.options = options;
    }
    init(onDiff, onEvent) {
        this.unsubscribe = this.options.subscribeDiffs((rawPayload) => {
            try {
                const diff = decodeBinaryDiff(rawPayload);
                onDiff(diff);
            }
            catch (err) {
                console.error('[TauriTransport] Failed to decode diff:', err);
            }
        });
    }
    sendInput(data) {
        this.options.sendInput(data);
    }
    resize(cols, rows) {
        this.options.sendResize(cols, rows);
    }
    dispose() {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }
}
