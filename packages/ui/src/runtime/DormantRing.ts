export class DormantRing {
  private chunks: Uint8Array[] = [];
  private totalBytes = 0;
  private maxBytes: number;

  constructor(maxBytes = 2 * 1024 * 1024) {
    this.maxBytes = maxBytes;
  }

  push(bytes: Uint8Array): void {
    if (bytes.length === 0) return;
    this.chunks.push(bytes);
    this.totalBytes += bytes.length;

    while (this.totalBytes > this.maxBytes && this.chunks.length > 0) {
      const removed = this.chunks.shift();
      if (removed) {
        this.totalBytes -= removed.length;
      }
    }
  }

  drain(writer: (chunk: Uint8Array) => void): void {
    for (const chunk of this.chunks) {
      writer(chunk);
    }
    this.chunks = [];
    this.totalBytes = 0;
  }

  byteLength(): number {
    return this.totalBytes;
  }

  clear(): void {
    this.chunks = [];
    this.totalBytes = 0;
  }
}
