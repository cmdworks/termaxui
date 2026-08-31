import { ITerminalOptions, TerminalDiff, TerminalTheme } from '../types.js';
export declare class DomRenderer {
    readonly element: HTMLDivElement;
    private lineElements;
    private options;
    constructor(options?: ITerminalOptions);
    attach(container: HTMLElement): void;
    resize(cols: number, rows: number): void;
    updateTheme(theme: TerminalTheme): void;
    applyDiff(diff: TerminalDiff): void;
    private initLines;
    private renderLine;
    private computeCellStyle;
}
//# sourceMappingURL=DomRenderer.d.ts.map