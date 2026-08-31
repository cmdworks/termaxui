import { Terminal } from '../Terminal.js';

export interface GhostTextOptions {
  textColor?: string;
  backgroundColor?: string;
  opacity?: number;
}

export class GhostTextManager {
  private terminal: Terminal;
  private currentSuggestion: string | null = null;
  private overlayElement: HTMLDivElement | null = null;
  private options: GhostTextOptions;

  constructor(terminal: Terminal, options: GhostTextOptions = {}) {
    this.terminal = terminal;
    this.options = {
      textColor: 'rgba(255, 255, 255, 0.4)',
      backgroundColor: 'transparent',
      opacity: 0.6,
      ...options,
    };
  }

  setSuggestion(text: string | null): void {
    this.currentSuggestion = text;
    this.render();
  }

  getSuggestion(): string | null {
    return this.currentSuggestion;
  }

  acceptSuggestion(): string | null {
    const text = this.currentSuggestion;
    this.setSuggestion(null);
    return text;
  }

  private render(): void {
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

  dispose(): void {
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this.overlayElement = null;
    this.currentSuggestion = null;
  }
}
