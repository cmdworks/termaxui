import { HoveredLink, ITerminalOptions, SearchMatch, SelectionRange, TerminalDiff, TerminalImage, TerminalTheme } from '../types.js';
export declare class WebGpuRenderer {
    readonly canvas: HTMLCanvasElement;
    private fallbackRenderer;
    private isWebGpuSupported;
    private adapter;
    private device;
    private context;
    private pipeline;
    private atlas;
    charWidth: number;
    charHeight: number;
    private dpr;
    private options;
    constructor(options?: ITerminalOptions);
    private initWebGpu;
    attach(container: HTMLElement): void;
    updateTheme(theme: TerminalTheme): void;
    setSelection(selection: SelectionRange | null): void;
    setSearchMatches(matches: SearchMatch[]): void;
    setHoveredLink(link: HoveredLink | null): void;
    setImages(images: TerminalImage[]): void;
    updateScroll(viewportY: number, totalLines: number): void;
    resize(cols: number, rows: number): void;
    applyDiff(diff: TerminalDiff): void;
    renderAll(): void;
    measureFont(): void;
    resizeCanvas(): void;
    isSupported(): boolean;
}
//# sourceMappingURL=WebGpuRenderer.d.ts.map