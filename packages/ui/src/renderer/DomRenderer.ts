import { CellFlags, ITerminalOptions, TerminalCell, TerminalColor, TerminalDiff, TerminalTheme } from '../types.js';

export class DomRenderer {
  public readonly element: HTMLDivElement;
  private lineElements: HTMLDivElement[] = [];
  private options: ITerminalOptions;

  constructor(options: ITerminalOptions = {}) {
    this.options = {
      cols: options.cols || 80,
      rows: options.rows || 24,
      fontFamily: options.fontFamily || 'monospace',
      fontSize: options.fontSize || 14,
      lineHeight: options.lineHeight || 1.2,
      theme: options.theme || {},
      cursorBlink: options.cursorBlink ?? true,
      cursorStyle: options.cursorStyle || 'block',
    };

    const fontSize = this.options.fontSize || 14;
    const fontFamily = this.options.fontFamily || 'monospace';
    const lineHeight = this.options.lineHeight || 1.2;

    this.element = document.createElement('div');
    this.element.className = 'termaxui-dom-renderer';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-label', 'Terminal Output');
    this.element.setAttribute('aria-live', 'polite');
    this.element.style.fontFamily = fontFamily;
    this.element.style.fontSize = `${fontSize}px`;
    this.element.style.lineHeight = `${lineHeight}`;
    this.element.style.backgroundColor = this.options.theme?.background || '#181818';
    this.element.style.color = this.options.theme?.foreground || '#ffffff';
    this.element.style.whiteSpace = 'pre';
    this.element.style.userSelect = 'text';

    this.initLines(this.options.rows || 24);
  }

  public attach(container: HTMLElement) {
    container.appendChild(this.element);
  }

  public resize(cols: number, rows: number) {
    this.options.cols = cols;
    this.options.rows = rows;
    this.initLines(rows);
  }

  public updateTheme(theme: TerminalTheme) {
    this.options.theme = theme;
    this.element.style.backgroundColor = theme.background || '#181818';
    this.element.style.color = theme.foreground || '#ffffff';
  }

  public applyDiff(diff: TerminalDiff) {
    if (diff.rows !== (this.options.rows || 24)) {
      this.resize(diff.cols, diff.rows);
    }

    for (const dirtyRow of diff.dirtyRows) {
      if (dirtyRow.row < this.lineElements.length) {
        this.renderLine(dirtyRow.row, dirtyRow.cells);
      }
    }
  }

  private initLines(rows: number) {
    this.element.replaceChildren();
    this.lineElements = new Array(rows);
    for (let r = 0; r < rows; r++) {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'termaxui-line';
      lineDiv.textContent = ' ';
      this.element.appendChild(lineDiv);
      this.lineElements[r] = lineDiv;
    }
  }

  private renderLine(row: number, cells: TerminalCell[]) {
    const lineEl = this.lineElements[row];
    if (!lineEl) return;

    lineEl.replaceChildren();

    let currentSpan: HTMLSpanElement | null = null;
    let currentStyle = '';

    for (let col = 0; col < cells.length; col++) {
      const cell = cells[col];
      if (cell.width === 0) continue;

      const style = this.computeCellStyle(cell);

      if (!currentSpan || style !== currentStyle) {
        currentSpan = document.createElement('span');
        if (style) currentSpan.style.cssText = style;
        lineEl.appendChild(currentSpan);
        currentStyle = style;
      }

      currentSpan.textContent += cell.char;
    }

    if (!lineEl.hasChildNodes()) {
      lineEl.textContent = ' ';
    }
  }

  private computeCellStyle(cell: TerminalCell): string {
    let css = '';
    if (cell.fg.type === 'rgb' && cell.fg.r !== undefined) {
      css += `color: rgb(${cell.fg.r},${cell.fg.g},${cell.fg.b});`;
    }
    if (cell.bg.type === 'rgb' && cell.bg.r !== undefined) {
      css += `background-color: rgb(${cell.bg.r},${cell.bg.g},${cell.bg.b});`;
    }
    if (cell.flags & CellFlags.BOLD) css += 'font-weight:bold;';
    if (cell.flags & CellFlags.ITALIC) css += 'font-style:italic;';
    if (cell.flags & CellFlags.UNDERLINE) css += 'text-decoration:underline;';
    if (cell.flags & CellFlags.STRIKETHROUGH) css += 'text-decoration:line-through;';
    return css;
  }
}
