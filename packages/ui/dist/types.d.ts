export interface TerminalColor {
    type: 'default' | 'indexed' | 'rgb';
    index?: number;
    r?: number;
    g?: number;
    b?: number;
}
export declare const CellFlags: {
    readonly EMPTY: 0;
    readonly BOLD: number;
    readonly DIM: number;
    readonly ITALIC: number;
    readonly UNDERLINE: number;
    readonly BLINK: number;
    readonly INVERSE: number;
    readonly HIDDEN: number;
    readonly STRIKETHROUGH: number;
    readonly OVERLINE: number;
};
export interface TerminalCell {
    char: string;
    width: number;
    flags: number;
    fg: TerminalColor;
    bg: TerminalColor;
}
export type CursorShape = 'block' | 'underline' | 'bar';
export interface CursorState {
    col: number;
    row: number;
    visible: boolean;
    blinking: boolean;
    shape: CursorShape;
}
export interface DirtyRow {
    row: number;
    cells: TerminalCell[];
}
export interface TerminalDiff {
    cols: number;
    rows: number;
    cursor: CursorState;
    dirtyRows: DirtyRow[];
}
export interface SelectionPosition {
    col: number;
    row: number;
}
export interface SelectionRange {
    start: SelectionPosition;
    end: SelectionPosition;
}
export interface SearchMatch {
    startCol: number;
    endCol: number;
    row: number;
    active: boolean;
}
export interface HoveredLink {
    startCol: number;
    endCol: number;
    row: number;
    uri: string;
}
export interface TerminalImage {
    id: string;
    col: number;
    row: number;
    width: number;
    height: number;
    data: HTMLImageElement | ImageBitmap;
}
export interface TerminalTheme {
    background?: string;
    foreground?: string;
    cursor?: string;
    cursorAccent?: string;
    selectionBackground?: string;
    selectionForeground?: string;
    selectionInactiveBackground?: string;
    matchBackground?: string;
    matchBorder?: string;
    activeMatchBackground?: string;
    activeMatchBorder?: string;
    black?: string;
    red?: string;
    green?: string;
    yellow?: string;
    blue?: string;
    magenta?: string;
    cyan?: string;
    white?: string;
    brightBlack?: string;
    brightRed?: string;
    brightGreen?: string;
    brightYellow?: string;
    brightBlue?: string;
    brightMagenta?: string;
    brightCyan?: string;
    brightWhite?: string;
}
export type ITheme = TerminalTheme;
export interface ITerminalOptions {
    cols?: number;
    rows?: number;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
    theme?: TerminalTheme;
    cursorBlink?: boolean;
    cursorStyle?: CursorShape;
    cursorInactiveStyle?: 'outline' | 'block' | 'bar' | 'underline' | 'none';
    cursorWidth?: number;
    scrollback?: number;
    macOptionIsMeta?: boolean;
    macOptionClickForcesSelection?: boolean;
    rightClickSelectsWord?: boolean;
    allowProposedApi?: boolean;
    customGlyphs?: boolean;
    rescaleGlyphs?: boolean;
    drawBoldTextInBrightColors?: boolean;
    disableStdin?: boolean;
    minimumContrastRatio?: number;
}
export interface IDisposable {
    dispose(): void;
}
export interface IMarker extends IDisposable {
    readonly id: number;
    readonly isDisposed: boolean;
    readonly line: number;
    onDispose(callback: () => void): IDisposable;
}
export interface IDecorationOptions {
    x?: number;
    marker: IMarker;
    width?: number;
    height?: number;
    backgroundColor?: string;
    foregroundColor?: string;
    layer?: 'bottom' | 'top';
    overviewRulerOptions?: {
        color: string;
        position?: 'left' | 'center' | 'right' | 'full';
    };
}
export interface IDecoration extends IDisposable {
    readonly marker: IMarker;
    readonly element?: HTMLElement;
    onRender(callback: (element: HTMLElement) => void): IDisposable;
    onDispose(callback: () => void): IDisposable;
}
export interface IBufferRange {
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
}
export interface ILink {
    range: IBufferRange;
    text: string;
    activate(event: MouseEvent, text: string): void;
    hover?(event: MouseEvent, text: string): void;
    leave?(event: MouseEvent, text: string): void;
}
export interface ILinkProvider {
    provideLinks(y: number, callback: (links: ILink[] | undefined) => void): void;
}
export interface IBufferCell {
    getChar(): string;
    getChars(): string;
    getCode(): number;
    getWidth(): number;
    getFgColor(): number;
    getBgColor(): number;
}
export interface IBufferLine {
    readonly isWrapped: boolean;
    readonly length: number;
    getCell(x: number): IBufferCell | undefined;
    translateToString(trimRight?: boolean, startCol?: number, endCol?: number): string;
}
export interface IBufferActive {
    readonly type: 'normal' | 'alternate';
    readonly cursorX: number;
    readonly cursorY: number;
    readonly baseY: number;
    readonly viewportY: number;
    readonly length: number;
    getLine(y: number): IBufferLine | undefined;
    getNullCell(): IBufferCell;
}
export interface IBuffer {
    readonly active: IBufferActive;
    readonly normal: IBufferActive;
    readonly alternate: IBufferActive;
}
export interface TerminalTransport {
    init(onDiff: (diff: TerminalDiff) => void, onEvent?: (event: any) => void): void;
    sendInput(data: string | Uint8Array): void;
    resize(cols: number, rows: number): void;
    dispose(): void;
}
//# sourceMappingURL=types.d.ts.map