import { ITerminalAddon } from './addons/xterm-compat.js';
import { VtEngine } from './parser/VtEngine.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import {
  HoveredLink,
  IBuffer,
  IBufferActive,
  IBufferCell,
  IBufferLine,
  IDecoration,
  IDecorationOptions,
  IDisposable,
  ILink,
  ILinkProvider,
  IMarker,
  ITerminalOptions,
  SelectionRange,
  TerminalCell,
  TerminalTheme,
  TerminalTransport,
} from './types.js';

class RealBufferCell implements IBufferCell {
  private cell: TerminalCell;
  constructor(cell: TerminalCell) {
    this.cell = cell;
  }
  getChar(): string { return this.cell.char; }
  getChars(): string { return this.cell.char; }
  getCode(): number { return this.cell.char.codePointAt(0) || 32; }
  getWidth(): number { return this.cell.width; }
  getFgColor(): number { return 0; }
  getBgColor(): number { return 0; }
}

class RealBufferLine implements IBufferLine {
  public readonly isWrapped: boolean = false;
  public readonly length: number;
  private cells: TerminalCell[];

  constructor(cells: TerminalCell[]) {
    this.cells = cells;
    this.length = cells.length;
  }

  getCell(x: number): IBufferCell | undefined {
    const c = this.cells[x];
    return c ? new RealBufferCell(c) : undefined;
  }

  translateToString(trimRight?: boolean, startCol?: number, endCol?: number): string {
    let res = this.cells.map((c) => c.char).join('');
    if (startCol !== undefined || endCol !== undefined) {
      const s = startCol ?? 0;
      const e = endCol ?? res.length;
      res = res.slice(s, e);
    }
    return trimRight ? res.trimEnd() : res;
  }
}

class TerminalMarker implements IMarker {
  public readonly id: number;
  public isDisposed: boolean = false;
  public readonly line: number;
  private disposeListeners: (() => void)[] = [];

  constructor(id: number, line: number) {
    this.id = id;
    this.line = line;
  }

  public onDispose(callback: () => void): IDisposable {
    this.disposeListeners.push(callback);
    return {
      dispose: () => {
        this.disposeListeners = this.disposeListeners.filter((l) => l !== callback);
      },
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const listener of this.disposeListeners) {
      listener();
    }
    this.disposeListeners = [];
  }
}

class TerminalDecoration implements IDecoration {
  public readonly marker: IMarker;
  public readonly element?: HTMLElement;
  private isDisposed: boolean = false;
  private renderListeners: ((element: HTMLElement) => void)[] = [];
  private disposeListeners: (() => void)[] = [];

  constructor(options: IDecorationOptions) {
    this.marker = options.marker;
    if (typeof document !== 'undefined') {
      this.element = document.createElement('div');
      this.element.className = 'termaxui-decoration';
    }
  }

  public onRender(callback: (element: HTMLElement) => void): IDisposable {
    this.renderListeners.push(callback);
    if (this.element) callback(this.element);
    return {
      dispose: () => {
        this.renderListeners = this.renderListeners.filter((l) => l !== callback);
      },
    };
  }

  public onDispose(callback: () => void): IDisposable {
    this.disposeListeners.push(callback);
    return {
      dispose: () => {
        this.disposeListeners = this.disposeListeners.filter((l) => l !== callback);
      },
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.element?.remove();
    for (const listener of this.disposeListeners) {
      listener();
    }
    this.disposeListeners = [];
    this.renderListeners = [];
  }
}

export class Terminal {
  public readonly options: ITerminalOptions;
  public element?: HTMLElement;
  public textarea?: HTMLTextAreaElement;
  public readonly modes = {
    mouseTrackingMode: 'none',
    bracketedPasteMode: false,
  };

  private vt: VtEngine;
  public readonly renderer: CanvasRenderer;
  private transport?: TerminalTransport;
  private addons: ITerminalAddon[] = [];
  private nextMarkerId: number = 1;

  private isMouseDown: boolean = false;
  private selection: SelectionRange | null = null;
  private lastClickTime: number = 0;
  private clickCount: number = 0;

  private hoveredLink: HoveredLink | null = null;
  private currentHoveredILink: ILink | null = null;
  private activeLinks: ILink[] = [];

  private dataListeners: ((data: string) => void)[] = [];
  private resizeListeners: ((size: { cols: number; rows: number }) => void)[] = [];
  private titleListeners: ((title: string) => void)[] = [];
  private bellListeners: (() => void)[] = [];
  private lineFeedListeners: (() => void)[] = [];
  private scrollListeners: ((position: number) => void)[] = [];
  private selectionChangeListeners: (() => void)[] = [];
  private writeParsedListeners: (() => void)[] = [];
  private renderListeners: ((event: { start: number; end: number }) => void)[] = [];
  private cursorMoveListeners: (() => void)[] = [];
  private keyListeners: ((event: { key: string; domEvent: KeyboardEvent }) => void)[] = [];
  private customKeyEventHandler?: (event: KeyboardEvent) => boolean;

  private oscHandlers = new Map<number, Set<(data: string) => boolean | Promise<boolean>>>();
  private linkProviders: ILinkProvider[] = [];

  public readonly parser = {
    registerOscHandler: (ident: number, handler: (data: string) => boolean | Promise<boolean>): IDisposable => {
      let set = this.oscHandlers.get(ident);
      if (!set) {
        set = new Set();
        this.oscHandlers.set(ident, set);
      }
      set.add(handler);
      return {
        dispose: () => {
          const s = this.oscHandlers.get(ident);
          if (s) {
            s.delete(handler);
            if (s.size === 0) this.oscHandlers.delete(ident);
          }
        },
      };
    },
  };

  public readonly unicode = {
    activeVersion: '11',
  };

  constructor(options: ITerminalOptions = {}) {
    this.options = {
      cols: options.cols || 80,
      rows: options.rows || 24,
      fontFamily: options.fontFamily || 'monospace',
      fontSize: options.fontSize || 14,
      ...options,
    };

    this.vt = new VtEngine(this.options.cols || 80, this.options.rows || 24, {
      onTitle: (title) => {
        for (const l of this.titleListeners) l(title);
      },
      onBell: () => {
        for (const l of this.bellListeners) l();
      },
      onOsc: (ident, data) => {
        const handlers = this.oscHandlers.get(ident);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(data);
            } catch (err) {
              console.warn('[Terminal] OSC handler error:', err);
            }
          }
        }
      },
    });

    this.renderer = new CanvasRenderer(this.options);
    if (typeof document !== 'undefined') {
      this.textarea = document.createElement('textarea');
      this.textarea.className = 'xterm-helper-textarea';
      this.textarea.setAttribute('aria-label', 'Terminal input');
      this.textarea.setAttribute('autocapitalize', 'off');
      this.textarea.setAttribute('autocomplete', 'off');
      this.textarea.setAttribute('autocorrect', 'off');
      this.textarea.setAttribute('spellcheck', 'false');
      this.textarea.style.position = 'absolute';
      this.textarea.style.opacity = '0';
      this.textarea.style.left = '-9999px';
      this.textarea.style.top = '-9999px';
      this.textarea.style.width = '0';
      this.textarea.style.height = '0';
      this.textarea.style.zIndex = '-10';
      this.attachTextareaHandlers(this.textarea);
    }
  }

  public get cols(): number {
    return this.vt.cols;
  }

  public get rows(): number {
    return this.vt.rows;
  }

  public get buffer(): IBuffer {
    const totalLines = this.vt.scrollback.length + this.vt.lines.length;
    const getLineAt = (y: number): IBufferLine | undefined => {
      if (y < this.vt.scrollback.length) {
        return new RealBufferLine(this.vt.scrollback[y]);
      }
      const gridIdx = y - this.vt.scrollback.length;
      if (gridIdx < this.vt.lines.length) {
        return new RealBufferLine(this.vt.lines[gridIdx]);
      }
      return undefined;
    };

    const activeInterface: IBufferActive = {
      type: 'normal',
      cursorX: this.vt.cursor.col,
      cursorY: this.vt.cursor.row,
      baseY: this.vt.scrollback.length,
      viewportY: this.vt.viewportY,
      length: totalLines,
      getLine: getLineAt,
      getNullCell: (): IBufferCell => new RealBufferCell({
        char: ' ',
        width: 1,
        flags: 0,
        fg: { type: 'default' },
        bg: { type: 'default' },
      }),
    };

    return {
      active: activeInterface,
      normal: activeInterface,
      alternate: { ...activeInterface, type: 'alternate' },
    };
  }

  public setTransport(transport: TerminalTransport) {
    this.transport = transport;
    this.transport.init((diff) => {
      this.renderer.applyDiff(diff);
      for (const listener of this.renderListeners) {
        listener({ start: 0, end: this.rows });
      }
      for (const listener of this.writeParsedListeners) {
        listener();
      }
    });
  }

  public loadAddon(addon: ITerminalAddon): void {
    this.addons.push(addon);
    addon.activate(this);
  }

  public open(container: HTMLElement) {
    this.element = container;
    container.style.position = 'relative';
    container.tabIndex = 0;
    container.style.outline = 'none';

    if (this.textarea) container.appendChild(this.textarea);
    this.renderer.attach(container);
    this.attachInputHandlers(container);
    this.attachMouseSelectionHandlers(container);
    this.attachDragAndDropHandlers(container);
    this.attachWheelScrollHandlers(container);

    for (const addon of this.addons) {
      addon.activate(this);
    }

    this.refresh(0, this.rows - 1);
  }

  public write(data: string | Uint8Array, callback?: () => void) {
    const diff = this.vt.feed(data);
    this.renderer.applyDiff(diff);

    for (const listener of this.renderListeners) {
      listener({ start: 0, end: this.rows });
    }
    for (const listener of this.writeParsedListeners) {
      listener();
    }
    callback?.();
  }

  public writeln(data: string | Uint8Array, callback?: () => void) {
    if (typeof data === 'string') {
      this.write(data + '\r\n', callback);
    } else {
      this.write(data, callback);
    }
  }

  public paste(data: string) {
    let payload = data;
    if (this.modes.bracketedPasteMode) {
      payload = `\x1b[200~${data}\x1b[201~`;
    }
    for (const listener of this.dataListeners) {
      listener(payload);
    }
  }

  public clear(): void {
    this.vt.reset();
    this.clearSelection();
    this.renderer.renderAll();
  }

  public reset(): void {
    this.clear();
  }

  public refresh(_start: number, _end: number): void {
    this.renderer.measureFont();
    this.renderer.resizeCanvas();
    this.renderer.renderAll();
  }

  public resize(cols: number, rows: number) {
    this.options.cols = cols;
    this.options.rows = rows;
    this.vt.resize(cols, rows);
    this.renderer.resize(cols, rows);
    this.transport?.resize(cols, rows);

    for (const listener of this.resizeListeners) {
      listener({ cols, rows });
    }
  }

  public updateTheme(theme: TerminalTheme) {
    this.options.theme = theme;
    this.renderer.updateTheme(theme);
  }

  public focus(): void {
    if (this.options.disableStdin) return;
    this.textarea?.focus({ preventScroll: true });
    this.element?.focus({ preventScroll: true });
  }

  public blur(): void {
    this.textarea?.blur();
    this.element?.blur();
  }

  // Scrollback Navigation APIs
  public scrollLines(amount: number): void {
    this.vt.scrollLines(amount);
    this.renderer.updateScroll(this.vt.viewportY, this.buffer.active.length);
    const diff = this.vt.feed('');
    this.renderer.applyDiff(diff);
    for (const listener of this.scrollListeners) {
      listener(this.vt.viewportY);
    }
  }

  public scrollToBottom(): void {
    this.vt.scrollToBottom();
    this.renderer.updateScroll(this.vt.viewportY, this.buffer.active.length);
    const diff = this.vt.feed('');
    this.renderer.applyDiff(diff);
    for (const listener of this.scrollListeners) {
      listener(this.vt.viewportY);
    }
  }

  public scrollToTop(): void {
    this.vt.scrollToTop();
    this.renderer.updateScroll(this.vt.viewportY, this.buffer.active.length);
    const diff = this.vt.feed('');
    this.renderer.applyDiff(diff);
    for (const listener of this.scrollListeners) {
      listener(this.vt.viewportY);
    }
  }

  public scrollToLine(line: number): void {
    this.vt.scrollToLine(line);
    this.renderer.updateScroll(this.vt.viewportY, this.buffer.active.length);
    const diff = this.vt.feed('');
    this.renderer.applyDiff(diff);
    for (const listener of this.scrollListeners) {
      listener(this.vt.viewportY);
    }
  }

  // Selection & Copy APIs
  public select(column: number, row: number, length: number): void {
    this.selection = {
      start: { col: column, row },
      end: { col: column + length - 1, row },
    };
    this.renderer.setSelection(this.selection);
    for (const l of this.selectionChangeListeners) l();
  }

  public selectLines(start: number, end: number): void {
    this.selection = {
      start: { col: 0, row: Math.max(0, start) },
      end: { col: this.cols - 1, row: Math.min(this.rows - 1, end) },
    };
    this.renderer.setSelection(this.selection);
    for (const l of this.selectionChangeListeners) l();
  }

  public selectAll(): void {
    this.selectLines(0, this.rows - 1);
  }

  public getSelection(): string {
    if (!this.selection) return '';
    let sRow = this.selection.start.row;
    let sCol = this.selection.start.col;
    let eRow = this.selection.end.row;
    let eCol = this.selection.end.col;

    if (sRow > eRow || (sRow === eRow && sCol > eCol)) {
      const tR = sRow; sRow = eRow; eRow = tR;
      const tC = sCol; sCol = eCol; eCol = tC;
    }

    const lines: string[] = [];
    for (let r = sRow; r <= eRow; r++) {
      if (r < this.vt.lines.length) {
        const rowCells = this.vt.lines[r];
        const startC = r === sRow ? sCol : 0;
        const endC = r === eRow ? eCol : this.cols - 1;
        const lineText = rowCells
          .slice(Math.max(0, startC), Math.min(this.cols, endC + 1))
          .map((c) => c.char)
          .join('');
        lines.push(lineText.trimEnd());
      }
    }
    return lines.join('\n');
  }

  public getSelectionPosition(): { start: { x: number; y: number }; end: { x: number; y: number } } | undefined {
    if (!this.selection) return undefined;
    return {
      start: { x: this.selection.start.col, y: this.selection.start.row },
      end: { x: this.selection.end.col, y: this.selection.end.row },
    };
  }

  public clearSelection(): void {
    if (this.selection) {
      this.selection = null;
      this.renderer.setSelection(null);
      for (const l of this.selectionChangeListeners) l();
    }
  }

  public hasSelection(): boolean {
    return this.selection !== null;
  }

  public registerMarker(cursorYOffset?: number): IMarker {
    const marker = new TerminalMarker(this.nextMarkerId++, (cursorYOffset ?? 0));
    return marker;
  }

  public registerDecoration(options: IDecorationOptions): IDecoration | undefined {
    return new TerminalDecoration(options);
  }

  public registerLinkProvider(provider: ILinkProvider): IDisposable {
    this.linkProviders.push(provider);
    return {
      dispose: () => {
        this.linkProviders = this.linkProviders.filter((p) => p !== provider);
      },
    };
  }

  public attachCustomKeyEventHandler(handler: (event: KeyboardEvent) => boolean): void {
    this.customKeyEventHandler = handler;
  }

  public onData(callback: (data: string) => void): IDisposable {
    this.dataListeners.push(callback);
    return {
      dispose: () => {
        this.dataListeners = this.dataListeners.filter((l) => l !== callback);
      },
    };
  }

  public onResize(callback: (size: { cols: number; rows: number }) => void): IDisposable {
    this.resizeListeners.push(callback);
    return {
      dispose: () => {
        this.resizeListeners = this.resizeListeners.filter((l) => l !== callback);
      },
    };
  }

  public onTitleChange(callback: (title: string) => void): IDisposable {
    this.titleListeners.push(callback);
    return {
      dispose: () => {
        this.titleListeners = this.titleListeners.filter((l) => l !== callback);
      },
    };
  }

  public onBell(callback: () => void): IDisposable {
    this.bellListeners.push(callback);
    return {
      dispose: () => {
        this.bellListeners = this.bellListeners.filter((l) => l !== callback);
      },
    };
  }

  public onLineFeed(callback: () => void): IDisposable {
    this.lineFeedListeners.push(callback);
    return {
      dispose: () => {
        this.lineFeedListeners = this.lineFeedListeners.filter((l) => l !== callback);
      },
    };
  }

  public onScroll(callback: (position: number) => void): IDisposable {
    this.scrollListeners.push(callback);
    return {
      dispose: () => {
        this.scrollListeners = this.scrollListeners.filter((l) => l !== callback);
      },
    };
  }

  public onSelectionChange(callback: () => void): IDisposable {
    this.selectionChangeListeners.push(callback);
    return {
      dispose: () => {
        this.selectionChangeListeners = this.selectionChangeListeners.filter((l) => l !== callback);
      },
    };
  }

  public onKey(callback: (event: { key: string; domEvent: KeyboardEvent }) => void): IDisposable {
    this.keyListeners.push(callback);
    return {
      dispose: () => {
        this.keyListeners = this.keyListeners.filter((l) => l !== callback);
      },
    };
  }

  public onWriteParsed(callback: () => void): IDisposable {
    this.writeParsedListeners.push(callback);
    return {
      dispose: () => {
        this.writeParsedListeners = this.writeParsedListeners.filter((l) => l !== callback);
      },
    };
  }

  public onRender(callback: (event: { start: number; end: number }) => void): IDisposable {
    this.renderListeners.push(callback);
    return {
      dispose: () => {
        this.renderListeners = this.renderListeners.filter((l) => l !== callback);
      },
    };
  }

  public onCursorMove(callback: () => void): IDisposable {
    this.cursorMoveListeners.push(callback);
    return {
      dispose: () => {
        this.cursorMoveListeners = this.cursorMoveListeners.filter((l) => l !== callback);
      },
    };
  }

  private handleKeyEvent(e: KeyboardEvent) {
    if (this.options.disableStdin) return;
    if (this.customKeyEventHandler && !this.customKeyEventHandler(e)) {
      return;
    }

    for (const listener of this.keyListeners) {
      listener({ key: e.key, domEvent: e });
    }

    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Auto-scroll to bottom on typing
    if (this.vt.viewportY !== this.vt.scrollback.length) {
      this.scrollToBottom();
    }

    // Clipboard Copy: Cmd+C / Ctrl+C
    if (cmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
      if (this.hasSelection()) {
        const text = this.getSelection();
        if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(text).catch(() => {});
          return;
        }
      }
    }

    // Clipboard Paste: Cmd+V / Ctrl+V
    if (cmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.readText().then((text) => {
          if (text) this.paste(text);
        }).catch(() => {});
        return;
      }
    }

    // Select All: Cmd+A / Ctrl+A
    if (cmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      this.selectAll();
      return;
    }

    let payload = '';
    if (e.key === 'Enter') payload = '\r';
    else if (e.key === 'Backspace') payload = '\x7f';
    else if (e.key === 'Tab') {
      e.preventDefault();
      payload = '\t';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      payload = '\x1b[A';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      payload = '\x1b[B';
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      payload = '\x1b[C';
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      payload = '\x1b[D';
    } else if (e.key === 'Escape') {
      payload = '\x1b';
    } else if (e.ctrlKey && e.key.length === 1) {
      const code = e.key.toLowerCase().charCodeAt(0) - 96;
      if (code >= 1 && code <= 26) {
        payload = String.fromCharCode(code);
      }
    } else if (e.key.length === 1 && !e.metaKey && !e.altKey) {
      payload = e.key;
    }

    if (payload) {
      this.clearSelection();
      for (const listener of this.dataListeners) {
        listener(payload);
      }
    }
  }

  private attachTextareaHandlers(textarea: HTMLTextAreaElement) {
    textarea.addEventListener('keydown', (e) => {
      this.handleKeyEvent(e);
    });
    textarea.addEventListener('input', () => {
      if (textarea.value) {
        const val = textarea.value;
        textarea.value = '';
        if (!this.options.disableStdin) {
          this.clearSelection();
          for (const listener of this.dataListeners) {
            listener(val);
          }
        }
      }
    });
    textarea.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        e.preventDefault();
        this.paste(text);
      }
    });
  }

  private getGridCoordinates(e: MouseEvent): { col: number; row: number } {
    if (!this.element) return { col: 0, row: 0 };
    const rect = this.element.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left);
    const y = Math.max(0, e.clientY - rect.top);
    const charW = this.renderer.charWidth || 9;
    const charH = this.renderer.charHeight || 18;
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / charW)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / charH)));
    return { col, row };
  }

  private attachWheelScrollHandlers(container: HTMLElement) {
    container.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY) * Math.max(1, Math.abs(Math.round(e.deltaY / 24)));
        this.scrollLines(delta);
      },
      { passive: false }
    );
  }

  private scanLinksAtRow(row1Based: number) {
    this.activeLinks = [];
    for (const provider of this.linkProviders) {
      provider.provideLinks(row1Based, (links) => {
        if (links) this.activeLinks.push(...links);
      });
    }
  }

  private attachMouseSelectionHandlers(container: HTMLElement) {
    container.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      this.focus();

      // Check for link click
      if (this.currentHoveredILink && (e.metaKey || e.ctrlKey)) {
        this.currentHoveredILink.activate(e, this.currentHoveredILink.text);
        return;
      }

      const now = performance.now();
      if (now - this.lastClickTime < 350) {
        this.clickCount++;
      } else {
        this.clickCount = 1;
      }
      this.lastClickTime = now;

      const pos = this.getGridCoordinates(e);

      if (this.clickCount === 2) {
        // Double click: Select Word
        const r = pos.row;
        const visible = this.vt.getVisibleLines();
        if (r < visible.length) {
          const cells = visible[r];
          let start = pos.col;
          let end = pos.col;
          while (start > 0 && cells[start - 1]?.char && cells[start - 1].char !== ' ') start--;
          while (end < this.cols - 1 && cells[end + 1]?.char && cells[end + 1].char !== ' ') end++;
          this.selection = {
            start: { col: start, row: r },
            end: { col: end, row: r },
          };
          this.renderer.setSelection(this.selection);
          for (const l of this.selectionChangeListeners) l();
        }
        return;
      }

      if (this.clickCount >= 3) {
        // Triple click: Select Line
        this.selectLines(pos.row, pos.row);
        return;
      }

      this.isMouseDown = true;
      this.clearSelection();
      this.selection = { start: pos, end: pos };
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isMouseDown && this.selection) {
        const pos = this.getGridCoordinates(e);
        this.selection.end = pos;
        this.renderer.setSelection(this.selection);
        for (const l of this.selectionChangeListeners) l();
        return;
      }

      if (this.element && this.element.contains(e.target as Node)) {
        const pos = this.getGridCoordinates(e);
        const col1Based = pos.col + 1;
        const row1Based = this.vt.viewportY + pos.row + 1;

        this.scanLinksAtRow(row1Based);

        const link = this.activeLinks.find(
          (l) =>
            l.range.start.y === row1Based &&
            col1Based >= l.range.start.x &&
            col1Based <= l.range.end.x
        );

        if (link) {
          if (this.currentHoveredILink !== link) {
            this.currentHoveredILink?.leave?.(e, this.currentHoveredILink.text);
            this.currentHoveredILink = link;
            link.hover?.(e, link.text);
          }
          this.hoveredLink = {
            startCol: link.range.start.x - 1,
            endCol: link.range.end.x - 1,
            row: pos.row,
            uri: link.text,
          };
          this.renderer.setHoveredLink(this.hoveredLink);
          if (e.metaKey || e.ctrlKey) {
            container.style.cursor = 'pointer';
          } else {
            container.style.cursor = 'text';
          }
        } else {
          if (this.currentHoveredILink) {
            this.currentHoveredILink.leave?.(e, this.currentHoveredILink.text);
            this.currentHoveredILink = null;
          }
          if (this.hoveredLink) {
            this.hoveredLink = null;
            this.renderer.setHoveredLink(null);
            container.style.cursor = 'text';
          }
        }
      } else {
        if (this.currentHoveredILink) {
          this.currentHoveredILink.leave?.(e, this.currentHoveredILink.text);
          this.currentHoveredILink = null;
        }
        if (this.hoveredLink) {
          this.hoveredLink = null;
          this.renderer.setHoveredLink(null);
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        if (
          this.selection &&
          this.selection.start.col === this.selection.end.col &&
          this.selection.start.row === this.selection.end.row &&
          this.clickCount === 1
        ) {
          this.clearSelection();
        }
      }
    });
  }

  private attachDragAndDropHandlers(container: HTMLElement) {
    let dragCounter = 0;

    container.addEventListener('dragenter', (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      container.classList.add('termax-drop-active');
    });

    container.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });

    container.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        container.classList.remove('termax-drop-active');
      }
    });

    container.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      container.classList.remove('termax-drop-active');

      if (!e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const paths = files.map((f) => {
          const path = (f as any).path || f.name;
          return /[\s"'\\]/.test(path) ? `'${path.replace(/'/g, `'\\''`)}'` : path;
        });
        this.paste(paths.join(' ') + ' ');
      } else {
        const text = e.dataTransfer.getData('text/plain');
        if (text) {
          this.paste(text);
        }
      }
    });
  }

  private attachInputHandlers(container: HTMLElement) {
    container.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyEvent(e);
    });
  }

  public dispose() {
    for (const addon of this.addons) {
      addon.dispose();
    }
    this.addons = [];
    this.transport?.dispose();
    this.element?.replaceChildren();
    this.dataListeners = [];
    this.resizeListeners = [];
    this.titleListeners = [];
    this.bellListeners = [];
    this.lineFeedListeners = [];
    this.scrollListeners = [];
    this.selectionChangeListeners = [];
    this.writeParsedListeners = [];
    this.renderListeners = [];
    this.cursorMoveListeners = [];
    this.keyListeners = [];
  }
}
