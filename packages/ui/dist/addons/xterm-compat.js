export class FitAddon {
    terminal;
    resizeObserver;
    activate(terminal) {
        this.terminal = terminal;
        if (terminal.element && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                this.fit();
            });
            this.resizeObserver.observe(terminal.element);
        }
    }
    fit() {
        if (!this.terminal || !this.terminal.element)
            return;
        const container = this.terminal.element;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width <= 0 || height <= 0)
            return;
        const charWidth = this.terminal.renderer?.charWidth || 9;
        const charHeight = this.terminal.renderer?.charHeight || 18;
        const cols = Math.max(2, Math.floor(width / charWidth));
        const rows = Math.max(1, Math.floor(height / charHeight));
        this.terminal.resize(cols, rows);
    }
    proposeDimensions() {
        if (!this.terminal || !this.terminal.element)
            return undefined;
        const container = this.terminal.element;
        const charWidth = this.terminal.renderer?.charWidth || 9;
        const charHeight = this.terminal.renderer?.charHeight || 18;
        const cols = Math.max(2, Math.floor(container.clientWidth / charWidth));
        const rows = Math.max(1, Math.floor(container.clientHeight / charHeight));
        return { cols, rows };
    }
    dispose() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.terminal = undefined;
    }
}
export class SearchAddon {
    terminal;
    onResultsListeners = [];
    matches = [];
    currentIndex = -1;
    activate(terminal) {
        this.terminal = terminal;
    }
    findNext(term, options) {
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
    findPrevious(term, options) {
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
    scanMatches(term, options) {
        if (!this.terminal)
            return;
        this.matches = [];
        const flags = options?.caseSensitive ? 'g' : 'gi';
        let regex;
        try {
            if (options?.regex) {
                regex = new RegExp(options.wholeWord ? `\\b(?:${term})\\b` : term, flags);
            }
            else {
                const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regex = new RegExp(options?.wholeWord ? `\\b${escaped}\\b` : escaped, flags);
            }
        }
        catch {
            return;
        }
        const buf = this.terminal.buffer.active;
        const totalLines = buf.length;
        for (let r = 0; r < totalLines; r++) {
            const line = buf.getLine(r);
            if (!line)
                continue;
            const str = line.translateToString(false);
            let match;
            while ((match = regex.exec(str)) !== null) {
                this.matches.push({
                    col: match.index,
                    row: r - buf.baseY,
                    length: match[0].length,
                    globalRow: r,
                });
                if (match.index === regex.lastIndex)
                    regex.lastIndex++;
            }
        }
    }
    scrollToActiveMatch() {
        if (!this.terminal || this.currentIndex === -1 || !this.matches[this.currentIndex])
            return;
        const match = this.matches[this.currentIndex];
        const targetLine = Math.max(0, match.globalRow - Math.floor(this.terminal.rows / 2));
        this.terminal.scrollToLine(targetLine);
    }
    updateRendererMatches() {
        if (!this.terminal)
            return;
        const renderer = this.terminal.renderer;
        if (!renderer)
            return;
        const searchMatches = this.matches.map((m, idx) => ({
            startCol: m.col,
            endCol: m.col + m.length - 1,
            row: m.row,
            active: idx === this.currentIndex,
        }));
        renderer.setSearchMatches(searchMatches);
    }
    emitResults(resultIndex, resultCount) {
        for (const listener of this.onResultsListeners) {
            listener({ resultIndex, resultCount });
        }
    }
    onDidChangeResults(callback) {
        this.onResultsListeners.push(callback);
        return {
            dispose: () => {
                this.onResultsListeners = this.onResultsListeners.filter((l) => l !== callback);
            },
        };
    }
    clearDecorations() {
        this.matches = [];
        this.currentIndex = -1;
        this.emitResults(-1, 0);
        if (this.terminal) {
            this.terminal.renderer?.setSearchMatches([]);
        }
    }
    dispose() {
        this.clearDecorations();
        this.terminal = undefined;
        this.onResultsListeners = [];
    }
}
const URL_REGEX = /https?:\/\/[^\s"'<>)\]]+/g;
export class WebLinksAddon {
    terminal;
    handler;
    options;
    linkProviderDisposable;
    constructor(handler, options) {
        this.handler = handler;
        this.options = options;
    }
    activate(terminal) {
        this.terminal = terminal;
        this.linkProviderDisposable = terminal.registerLinkProvider({
            provideLinks: (y, callback) => {
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
                const links = [];
                let match;
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
                        activate: (e, uri) => {
                            if (this.options?.willLinkActivate && !this.options.willLinkActivate(e, uri))
                                return;
                            this.handler?.(e, uri);
                        },
                        hover: (e, uri) => {
                            this.options?.hover?.(e, uri);
                        },
                        leave: (e, uri) => {
                            this.options?.leave?.(e, uri);
                        },
                    });
                }
                callback(links.length > 0 ? links : undefined);
            },
        });
    }
    dispose() {
        this.linkProviderDisposable?.dispose();
        this.linkProviderDisposable = undefined;
        this.terminal = undefined;
        this.handler = undefined;
        this.options = undefined;
    }
}
export class SerializeAddon {
    terminal;
    activate(terminal) {
        this.terminal = terminal;
    }
    serialize(options) {
        if (!this.terminal)
            return '';
        const buf = this.terminal.buffer.active;
        const lines = [];
        const max = options?.scrollback ? Math.min(options.scrollback, buf.length) : buf.length;
        for (let r = 0; r < max; r++) {
            const line = buf.getLine(r);
            if (line)
                lines.push(line.translateToString(true));
        }
        return lines.join('\n');
    }
    serializeAsHTML(options) {
        if (!this.terminal)
            return '';
        const text = this.serialize(options);
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<div style="font-family: monospace; white-space: pre; background: #0e0e0f; color: #e2e2e3; padding: 12px;">${escaped}</div>`;
    }
    dispose() {
        this.terminal = undefined;
    }
}
export class WebglAddon {
    terminal;
    onContextLossListeners = [];
    activate(terminal) {
        this.terminal = terminal;
    }
    onContextLoss(callback) {
        this.onContextLossListeners.push(callback);
        return {
            dispose: () => {
                this.onContextLossListeners = this.onContextLossListeners.filter((l) => l !== callback);
            },
        };
    }
    clear() { }
    dispose() {
        this.terminal = undefined;
        this.onContextLossListeners = [];
    }
}
export class LigaturesAddon {
    terminal;
    activate(terminal) {
        this.terminal = terminal;
    }
    dispose() {
        this.terminal = undefined;
    }
}
export class ImageAddon {
    terminal;
    images = [];
    activate(terminal) {
        this.terminal = terminal;
    }
    addImage(image) {
        this.images.push(image);
        if (this.terminal) {
            this.terminal.renderer?.setImages(this.images);
        }
    }
    clear() {
        this.images = [];
        if (this.terminal) {
            this.terminal.renderer?.setImages([]);
        }
    }
    dispose() {
        this.clear();
        this.terminal = undefined;
    }
}
export class Unicode11Addon {
    terminal;
    activate(terminal) {
        this.terminal = terminal;
    }
    dispose() {
        this.terminal = undefined;
    }
}
