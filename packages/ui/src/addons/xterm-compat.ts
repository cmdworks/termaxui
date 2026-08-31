import { Terminal } from '../Terminal.js';
import { IBufferRange, IDisposable, ILink, SearchMatch, TerminalImage } from '../types.js';

export interface ITerminalAddon extends IDisposable {
  activate(terminal: Terminal): void;
}

export class FitAddon implements ITerminalAddon {
  private terminal?: Terminal;
  private resizeObserver?: ResizeObserver;

  public activate(terminal: Terminal): void {
    this.terminal = terminal;

    if (terminal.element && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.fit();
      });
      this.resizeObserver.observe(terminal.element);
    }
  }

  public fit(): void {
    if (!this.terminal || !this.terminal.element) return;

    const container = this.terminal.element;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) return;

    const charWidth = (this.terminal as any).renderer?.charWidth || 9;
    const charHeight = (this.terminal as any).renderer?.charHeight || 18;

    const cols = Math.max(2, Math.floor(width / charWidth));
    const rows = Math.max(1, Math.floor(height / charHeight));

    this.terminal.resize(cols, rows);
  }

  public proposeDimensions(): { cols: number; rows: number } | undefined {
    if (!this.terminal || !this.terminal.element) return undefined;
    const container = this.terminal.element;
    const charWidth = (this.terminal as any).renderer?.charWidth || 9;
    const charHeight = (this.terminal as any).renderer?.charHeight || 18;
    const cols = Math.max(2, Math.floor(container.clientWidth / charWidth));
    const rows = Math.max(1, Math.floor(container.clientHeight / charHeight));
    return { cols, rows };
  }

  public dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.terminal = undefined;
  }
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

export class SearchAddon implements ITerminalAddon {
  private terminal?: Terminal;
  private onResultsListeners: ((result: ISearchResult) => void)[] = [];
  private matches: { col: number; row: number; length: number; globalRow: number }[] = [];
  private currentIndex: number = -1;

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public findNext(term: string, options?: ISearchOptions): boolean {
    if (!this.terminal || !term) {
      this.clearDecorations();
      return false;
    }

    this.scanMatches(term, options);
    if (this.matches.length === 0) {
      this.currentIndex = -1;
      this.emitResults(-1, 0);
      this.updateRendererMatches();
      return false;
    }

    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this.emitResults(this.currentIndex, this.matches.length);
    this.updateRendererMatches();
    this.scrollToActiveMatch();
    return true;
  }

  public findPrevious(term: string, options?: ISearchOptions): boolean {
    if (!this.terminal || !term) {
      this.clearDecorations();
      return false;
    }

    this.scanMatches(term, options);
    if (this.matches.length === 0) {
      this.currentIndex = -1;
      this.emitResults(-1, 0);
      this.updateRendererMatches();
      return false;
    }

    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this.emitResults(this.currentIndex, this.matches.length);
    this.updateRendererMatches();
    this.scrollToActiveMatch();
    return true;
  }

  private scanMatches(term: string, options?: ISearchOptions) {
    if (!this.terminal) return;
    this.matches = [];

    const flags = options?.caseSensitive ? 'g' : 'gi';
    let regex: RegExp;
    try {
      if (options?.regex) {
        regex = new RegExp(options.wholeWord ? `\\b(?:${term})\\b` : term, flags);
      } else {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(options?.wholeWord ? `\\b${escaped}\\b` : escaped, flags);
      }
    } catch {
      return;
    }

    const buf = this.terminal.buffer.active;
    const totalLines = buf.length;

    for (let r = 0; r < totalLines; r++) {
      const line = buf.getLine(r);
      if (!line) continue;
      const str = line.translateToString(false);

      let match: RegExpExecArray | null;
      while ((match = regex.exec(str)) !== null) {
        this.matches.push({
          col: match.index,
          row: r - buf.baseY,
          length: match[0].length,
          globalRow: r,
        });
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
    }
  }

  private scrollToActiveMatch() {
    if (!this.terminal || this.currentIndex === -1 || !this.matches[this.currentIndex]) return;
    const match = this.matches[this.currentIndex];
    const targetLine = Math.max(0, match.globalRow - Math.floor(this.terminal.rows / 2));
    this.terminal.scrollToLine(targetLine);
  }

  private updateRendererMatches() {
    if (!this.terminal) return;
    const renderer = (this.terminal as any).renderer;
    if (!renderer) return;

    const searchMatches: SearchMatch[] = this.matches.map((m, idx) => ({
      startCol: m.col,
      endCol: m.col + m.length - 1,
      row: m.row,
      active: idx === this.currentIndex,
    }));
    renderer.setSearchMatches(searchMatches);
  }

  private emitResults(resultIndex: number, resultCount: number) {
    for (const listener of this.onResultsListeners) {
      listener({ resultIndex, resultCount });
    }
  }

  public onDidChangeResults(callback: (result: ISearchResult) => void): IDisposable {
    this.onResultsListeners.push(callback);
    return {
      dispose: () => {
        this.onResultsListeners = this.onResultsListeners.filter((l) => l !== callback);
      },
    };
  }

  public clearDecorations(): void {
    this.matches = [];
    this.currentIndex = -1;
    this.emitResults(-1, 0);
    if (this.terminal) {
      (this.terminal as any).renderer?.setSearchMatches([]);
    }
  }

  public dispose(): void {
    this.clearDecorations();
    this.terminal = undefined;
    this.onResultsListeners = [];
  }
}

export interface IWebLinksOptions {
  hover?: (event: MouseEvent, text: string) => void;
  leave?: (event: MouseEvent, text: string) => void;
  tooltipCallback?: (event: MouseEvent, uri: string, location: IBufferRange) => boolean | void;
  willLinkActivate?: (event: MouseEvent, uri: string) => boolean;
}

const URL_REGEX = /https?:\/\/[^\s"'<>)\]]+/g;

export class WebLinksAddon implements ITerminalAddon {
  private terminal?: Terminal;
  private handler?: (event: MouseEvent, uri: string) => void;
  private options?: IWebLinksOptions;
  private linkProviderDisposable?: IDisposable;

  constructor(
    handler?: (event: MouseEvent, uri: string) => void,
    options?: IWebLinksOptions
  ) {
    this.handler = handler;
    this.options = options;
  }

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
    this.linkProviderDisposable = terminal.registerLinkProvider({
      provideLinks: (y: number, callback: (links: ILink[] | undefined) => void) => {
        const line = terminal.buffer.active.getLine(y - 1);
        if (!line) {
          callback(undefined);
          return;
        }
        const text = line.translateToString(true);
        if (!text) {
          callback(undefined);
          return;
        }

        URL_REGEX.lastIndex = 0;
        const links: ILink[] = [];
        let match: RegExpExecArray | null;

        while ((match = URL_REGEX.exec(text)) !== null) {
          const matchText = match[0];
          const startX = match.index + 1;
          const endX = match.index + matchText.length;

          links.push({
            text: matchText,
            range: {
              start: { x: startX, y },
              end: { x: endX, y },
            },
            activate: (e: MouseEvent, uri: string) => {
              if (this.options?.willLinkActivate && !this.options.willLinkActivate(e, uri)) return;
              this.handler?.(e, uri);
            },
            hover: (e: MouseEvent, uri: string) => {
              this.options?.hover?.(e, uri);
            },
            leave: (e: MouseEvent, uri: string) => {
              this.options?.leave?.(e, uri);
            },
          });
        }

        callback(links.length > 0 ? links : undefined);
      },
    });
  }

  public dispose(): void {
    this.linkProviderDisposable?.dispose();
    this.linkProviderDisposable = undefined;
    this.terminal = undefined;
    this.handler = undefined;
    this.options = undefined;
  }
}

export interface ISerializeOptions {
  scrollback?: number;
  excludeAltBuffer?: boolean;
}

export class SerializeAddon implements ITerminalAddon {
  private terminal?: Terminal;

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public serialize(options?: ISerializeOptions): string {
    if (!this.terminal) return '';
    const buf = this.terminal.buffer.active;
    const lines: string[] = [];
    const max = options?.scrollback ? Math.min(options.scrollback, buf.length) : buf.length;
    for (let r = 0; r < max; r++) {
      const line = buf.getLine(r);
      if (line) lines.push(line.translateToString(true));
    }
    return lines.join('\n');
  }

  public serializeAsHTML(options?: any): string {
    if (!this.terminal) return '';
    const text = this.serialize(options);
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div style="font-family: monospace; white-space: pre; background: #0e0e0f; color: #e2e2e3; padding: 12px;">${escaped}</div>`;
  }

  public dispose(): void {
    this.terminal = undefined;
  }
}

export class WebglAddon implements ITerminalAddon {
  private terminal?: Terminal;
  private onContextLossListeners: (() => void)[] = [];

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public onContextLoss(callback: () => void): IDisposable {
    this.onContextLossListeners.push(callback);
    return {
      dispose: () => {
        this.onContextLossListeners = this.onContextLossListeners.filter((l) => l !== callback);
      },
    };
  }

  public clear(): void {}

  public dispose(): void {
    this.terminal = undefined;
    this.onContextLossListeners = [];
  }
}

export class LigaturesAddon implements ITerminalAddon {
  private terminal?: Terminal;

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public dispose(): void {
    this.terminal = undefined;
  }
}

export class ImageAddon implements ITerminalAddon {
  private terminal?: Terminal;
  private images: TerminalImage[] = [];

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public addImage(image: TerminalImage): void {
    this.images.push(image);
    if (this.terminal) {
      (this.terminal as any).renderer?.setImages(this.images);
    }
  }

  public clear(): void {
    this.images = [];
    if (this.terminal) {
      (this.terminal as any).renderer?.setImages([]);
    }
  }

  public dispose(): void {
    this.clear();
    this.terminal = undefined;
  }
}

export class Unicode11Addon implements ITerminalAddon {
  private terminal?: Terminal;

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public dispose(): void {
    this.terminal = undefined;
  }
}
