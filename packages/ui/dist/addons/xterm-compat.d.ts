import { Terminal } from '../Terminal.js';
import { IBufferRange, IDisposable, TerminalImage } from '../types.js';
export interface ITerminalAddon extends IDisposable {
    activate(terminal: Terminal): void;
}
export declare class FitAddon implements ITerminalAddon {
    private terminal?;
    private resizeObserver?;
    activate(terminal: Terminal): void;
    fit(): void;
    proposeDimensions(): {
        cols: number;
        rows: number;
    } | undefined;
    dispose(): void;
}
export interface ISearchOptions {
    regex?: boolean;
    wholeWord?: boolean;
    caseSensitive?: boolean;
    incremental?: boolean;
    decorations?: {
        matchBackground?: string;
        matchBorder?: string;
        matchOverviewRuler?: string;
        activeMatchBackground?: string;
        activeMatchBorder?: string;
        activeMatchColorOverviewRuler?: string;
    };
}
export interface ISearchResult {
    resultIndex: number;
    resultCount: number;
}
export declare class SearchAddon implements ITerminalAddon {
    private terminal?;
    private onResultsListeners;
    private matches;
    private currentIndex;
    activate(terminal: Terminal): void;
    findNext(term: string, options?: ISearchOptions): boolean;
    findPrevious(term: string, options?: ISearchOptions): boolean;
    private scanMatches;
    private scrollToActiveMatch;
    private updateRendererMatches;
    private emitResults;
    onDidChangeResults(callback: (result: ISearchResult) => void): IDisposable;
    clearDecorations(): void;
    dispose(): void;
}
export interface IWebLinksOptions {
    hover?: (event: MouseEvent, text: string) => void;
    leave?: (event: MouseEvent, text: string) => void;
    tooltipCallback?: (event: MouseEvent, uri: string, location: IBufferRange) => boolean | void;
    willLinkActivate?: (event: MouseEvent, uri: string) => boolean;
}
export declare class WebLinksAddon implements ITerminalAddon {
    private terminal?;
    private handler?;
    private options?;
    private linkProviderDisposable?;
    constructor(handler?: (event: MouseEvent, uri: string) => void, options?: IWebLinksOptions);
    activate(terminal: Terminal): void;
    dispose(): void;
}
export interface ISerializeOptions {
    scrollback?: number;
    excludeAltBuffer?: boolean;
}
export declare class SerializeAddon implements ITerminalAddon {
    private terminal?;
    activate(terminal: Terminal): void;
    serialize(options?: ISerializeOptions): string;
    serializeAsHTML(options?: any): string;
    dispose(): void;
}
export declare class WebglAddon implements ITerminalAddon {
    private terminal?;
    private onContextLossListeners;
    activate(terminal: Terminal): void;
    onContextLoss(callback: () => void): IDisposable;
    clear(): void;
    dispose(): void;
}
export declare class LigaturesAddon implements ITerminalAddon {
    private terminal?;
    activate(terminal: Terminal): void;
    dispose(): void;
}
export declare class ImageAddon implements ITerminalAddon {
    private terminal?;
    private images;
    activate(terminal: Terminal): void;
    addImage(image: TerminalImage): void;
    clear(): void;
    dispose(): void;
}
export declare class Unicode11Addon implements ITerminalAddon {
    private terminal?;
    activate(terminal: Terminal): void;
    dispose(): void;
}
//# sourceMappingURL=xterm-compat.d.ts.map