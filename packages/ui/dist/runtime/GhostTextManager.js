export class GhostTextManager {
    terminal;
    currentSuggestion = null;
    overlayElement = null;
    options;
    constructor(terminal, options = {}) {
        this.terminal = terminal;
        this.options = {
            textColor: 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            opacity: 0.6,
            ...options,
        };
    }
    setSuggestion(text) {
        this.currentSuggestion = text;
        this.render();
    }
    getSuggestion() {
        return this.currentSuggestion;
    }
    acceptSuggestion() {
        const text = this.currentSuggestion;
        this.setSuggestion(null);
        return text;
    }
    render() {
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
        z-index: 10;
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
        this.overlayElement.style.display = 'block';
        this.overlayElement.textContent = this.currentSuggestion;
    }
    dispose() {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        this.overlayElement = null;
        this.currentSuggestion = null;
    }
}
