import { HoveredLink, ITerminalOptions, SearchMatch, SelectionRange, TerminalDiff, TerminalImage, TerminalTheme } from '../types.js';
export declare class CanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    private ctx;
    charWidth: number;
    charHeight: number;
    private dpr;
    selection: SelectionRange | null;
    searchMatches: SearchMatch[];
    hoveredLink: HoveredLink | null;
    images: TerminalImage[];
    scrollProgress: {
        viewportY: number;
        totalLines: number;
    } | null;
    private scrollbarFadeTimer;
    private scrollbarAlpha;
    private grid;
    private cursor;
    private options;
    private palette;
    constructor(options?: ITerminalOptions);
    attach(container: HTMLElement): void;
    updateTheme(theme: TerminalTheme): void;
    setSelection(selection: SelectionRange | null): void;
    setSearchMatches(matches: SearchMatch[]): void;
    setHoveredLink(link: HoveredLink | null): void;
    setImages(images: TerminalImage[]): void;
    updateScroll(viewportY: number, totalLines: number): void;
    resize(cols: number, rows: number): void;
    applyDiff(diff: TerminalDiff): void;
    private initGrid;
    private initPalette;
    measureFont(): void;
    resizeCanvas(): void;
    renderAll(): void;
    private isCellSelected;
    private getSearchMatch;
    private isLinkHovered;
    private renderRow;
    private renderImages;
    private renderScrollbar;
    private resolveColor;
}
//# sourceMappingURL=CanvasRenderer.d.ts.map