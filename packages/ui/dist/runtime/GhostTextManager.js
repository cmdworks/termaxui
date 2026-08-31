export class GhostTextManager {
    terminal;
    currentSuggestion = null;
    overlayElement = null;
    options;
    listeners = [];
    keyDisposable;
    constructor(terminal, options = {}) {
        this.terminal = terminal;
        this.options = {
            textColor: 'rgba(160, 160, 170, 0.55)',
            backgroundColor: 'transparent',
            opacity: 0.85,
            enableKeyboardInterception: true,
            ...options,
        };
        if (this.options.enableKeyboardInterception) {
            this.attachKeyHandler();
        }
    }
    addListener(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    setSuggestion(text) {
        this.currentSuggestion = text;
        this.render();
        for (const l of this.listeners)
            l.onChange?.(text);
    }
    appendSuggestion(delta) {
        const next = (this.currentSuggestion || '') + delta;
        this.setSuggestion(next);
    }
    getSuggestion() {
        return this.currentSuggestion;
    }
    hasSuggestion() {
        return Boolean(this.currentSuggestion && this.currentSuggestion.length > 0);
    }
    accept() {
        const text = this.currentSuggestion;
        if (!text)
            return null;
        this.setSuggestion(null);
        for (const l of this.listeners)
            l.onAccept?.(text);
        return text;
    }
    acceptWord() {
        if (!this.currentSuggestion)
            return null;
        const match = this.currentSuggestion.match(/^(\s*\S+\s*)/);
        if (!match)
            return this.accept();
        const word = match[1];
        const remainder = this.currentSuggestion.slice(word.length);
        this.setSuggestion(remainder.length > 0 ? remainder : null);
        for (const l of this.listeners)
            l.onAccept?.(word);
        return word;
    }
    dismiss() {
        if (!this.currentSuggestion)
            return;
        this.setSuggestion(null);
        for (const l of this.listeners)
            l.onDismiss?.();
    }
    attachKeyHandler() {
        if (typeof this.terminal.onKey === 'function') {
            const d = this.terminal.onKey(({ domEvent }) => {
                if (!this.hasSuggestion())
                    return;
                if (domEvent.key === 'Tab' || (domEvent.key === 'ArrowRight' && !domEvent.altKey && !domEvent.metaKey)) {
                    domEvent.preventDefault();
                    domEvent.stopPropagation();
                    this.accept();
                }
                else if (domEvent.key === 'ArrowRight' && (domEvent.altKey || domEvent.ctrlKey)) {
                    domEvent.preventDefault();
                    domEvent.stopPropagation();
                    this.acceptWord();
                }
                else if (domEvent.key === 'Escape') {
                    domEvent.preventDefault();
                    domEvent.stopPropagation();
                    this.dismiss();
                }
            });
            this.keyDisposable = d;
        }
    }
    render() {
        if (typeof document === 'undefined')
            return;
        if (!this.currentSuggestion) {
            if (this.overlayElement) {
                this.overlayElement.style.display = 'none';
            }
            return;
        }
        if (!this.overlayElement) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.className = 'termax-ghost-text-overlay';
            this.overlayElement.style.cssText = `
        position: absolute;
        pointer-events: none;
        user-select: none;
        z-index: 20;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: ${this.options.textColor};
        background: ${this.options.backgroundColor};
        opacity: ${this.options.opacity};
        white-space: pre;
      `;
            this.terminal.element?.appendChild(this.overlayElement);
        }
        // Measure cursor pixel coordinates
        const charWidth = this.terminal.renderer?.charWidth || 9;
        const charHeight = this.terminal.renderer?.charHeight || 18;
        const cursorX = this.terminal.buffer.active.cursorX ?? 0;
        const cursorY = this.terminal.buffer.active.cursorY ?? 0;
        const leftPx = cursorX * charWidth;
        const topPx = cursorY * charHeight;
        this.overlayElement.style.left = `${leftPx}px`;
        this.overlayElement.style.top = `${topPx}px`;
        this.overlayElement.style.display = 'block';
        this.overlayElement.textContent = this.currentSuggestion;
    }
    dispose() {
        this.keyDisposable?.dispose();
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        this.overlayElement = null;
        this.currentSuggestion = null;
        this.listeners = [];
    }
}
