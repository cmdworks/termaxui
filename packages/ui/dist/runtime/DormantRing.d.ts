export declare class DormantRing {
    private chunks;
    private totalBytes;
    private maxBytes;
    constructor(maxBytes?: number);
    push(bytes: Uint8Array): void;
    drain(writer: (chunk: Uint8Array) => void): void;
    byteLength(): number;
    clear(): void;
}
//# sourceMappingURL=DormantRing.d.ts.map