export interface GlyphLocation {
    u0: number;
    v0: number;
    u1: number;
    v1: number;
    width: number;
    height: number;
}
export declare class GlyphAtlas {
    readonly width = 2048;
    readonly height = 2048;
    private canvas;
    private ctx;
    private glyphCache;
    private nextX;
    private nextY;
    private rowHeight;
    private dpr;
    isDirty: boolean;
    constructor(dpr?: number);
    getCanvas(): HTMLCanvasElement | null;
    getGlyph(char: string, font: string, fontSize: number, charWidth: number, charHeight: number): GlyphLocation;
    private rasterizeGlyph;
    clear(): void;
}
//# sourceMappingURL=GlyphAtlas.d.ts.map