export class DormantRing {
    chunks = [];
    totalBytes = 0;
    maxBytes;
    constructor(maxBytes = 2 * 1024 * 1024) {
        this.maxBytes = maxBytes;
    }
    push(bytes) {
        if (bytes.length === 0)
            return;
        this.chunks.push(bytes);
        this.totalBytes += bytes.length;
        while (this.totalBytes > this.maxBytes && this.chunks.length > 0) {
            const removed = this.chunks.shift();
            if (removed) {
                this.totalBytes -= removed.length;
            }
        }
    }
    drain(writer) {
        for (const chunk of this.chunks) {
            writer(chunk);
        }
        this.chunks = [];
        this.totalBytes = 0;
    }
    byteLength() {
        return this.totalBytes;
    }
    clear() {
        this.chunks = [];
        this.totalBytes = 0;
    }
}
