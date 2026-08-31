import { ITerminalAddon } from './addons/xterm-compat.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { IBuffer, IDecoration, IDecorationOptions, IDisposable, ILinkProvider, IMarker, ITerminalOptions, TerminalTheme, TerminalTransport } from './types.js';
export declare class Terminal {
    readonly options: ITerminalOptions;
    element?: HTMLElement;
    textarea?: HTMLTextAreaElement;
    readonly modes: {
        mouseTrackingMode: string;
        bracketedPasteMode: boolean;
    };
    private vt;
    readonly renderer: CanvasRenderer;
    private transport?;
    private addons;
    private nextMarkerId;
    private isMouseDown;
    private selection;
    private lastClickTime;
    private clickCount;
    private hoveredLink;
    private currentHoveredILink;
    private activeLinks;
    private dataListeners;
    private resizeListeners;
    private titleListeners;
    private bellListeners;
    private lineFeedListeners;
    private scrollListeners;
    private selectionChangeListeners;
    private writeParsedListeners;
    private renderListeners;
    private cursorMoveListeners;
    private keyListeners;
    private customKeyEventHandler?;
    private oscHandlers;
    private linkProviders;
    readonly parser: {
        registerOscHandler: (ident: number, handler: (data: string) => boolean | Promise<boolean>) => IDisposable;
    };
    readonly unicode: {
        activeVersion: string;
    };
    constructor(options?: ITerminalOptions);
    get cols(): number;
    get rows(): number;
    get buffer(): IBuffer;
    setTransport(transport: TerminalTransport): void;
    loadAddon(addon: ITerminalAddon): void;
    open(container: HTMLElement): void;
    write(data: string | Uint8Array, callback?: () => void): void;
    writeln(data: string | Uint8Array, callback?: () => void): void;
    paste(data: string): void;
    clear(): void;
    reset(): void;
    refresh(_start: number, _end: number): void;
    resize(cols: number, rows: number): void;
    updateTheme(theme: TerminalTheme): void;
    focus(): void;
    blur(): void;
    scrollLines(amount: number): void;
    scrollToBottom(): void;
    scrollToTop(): void;
    scrollToLine(line: number): void;
    select(column: number, row: number, length: number): void;
    selectLines(start: number, end: number): void;
    selectAll(): void;
    getSelection(): string;
    getSelectionPosition(): {
        start: {
            x: number;
            y: number;
        };
        end: {
            x: number;
            y: number;
        };
    } | undefined;
    clearSelection(): void;
    hasSelection(): boolean;
    registerMarker(cursorYOffset?: number): IMarker;
    registerDecoration(options: IDecorationOptions): IDecoration | undefined;
    registerLinkProvider(provider: ILinkProvider): IDisposable;
    attachCustomKeyEventHandler(handler: (event: KeyboardEvent) => boolean): void;
    onData(callback: (data: string) => void): IDisposable;
    onResize(callback: (size: {
        cols: number;
        rows: number;
    }) => void): IDisposable;
    onTitleChange(callback: (title: string) => void): IDisposable;
    onBell(callback: () => void): IDisposable;
    onLineFeed(callback: () => void): IDisposable;
    onScroll(callback: (position: number) => void): IDisposable;
    onSelectionChange(callback: () => void): IDisposable;
    onKey(callback: (event: {
        key: string;
        domEvent: KeyboardEvent;
    }) => void): IDisposable;
    onWriteParsed(callback: () => void): IDisposable;
    onRender(callback: (event: {
        start: number;
        end: number;
    }) => void): IDisposable;
    onCursorMove(callback: () => void): IDisposable;
    private handleKeyEvent;
    private attachTextareaHandlers;
    private getGridCoordinates;
    private attachWheelScrollHandlers;
    private scanLinksAtRow;
    private attachMouseSelectionHandlers;
    private attachDragAndDropHandlers;
    private attachInputHandlers;
    dispose(): void;
}
//# sourceMappingURL=Terminal.d.ts.map