import { CellFlags, } from '../types.js';
export class VtEngine {
    cols;
    rows;
    maxScrollback = 10000;
    lines = [];
    scrollback = [];
    viewportY = 0; // 0 to scrollback.length
    cursor = {
        col: 0,
        row: 0,
        visible: true,
        blinking: true,
        shape: 'block',
    };
    savedCursor = { col: 0, row: 0 };
    scrollTop = 0;
    scrollBottom = 23;
    currentFg = { type: 'default' };
    currentBg = { type: 'default' };
    currentFlags = CellFlags.EMPTY;
    dirtyRowSet = new Set();
    events;
    // Parser state
    state = 'GROUND';
    csiParams = '';
    oscBuffer = '';
    constructor(cols = 80, rows = 24, events = {}) {
        this.cols = Math.max(1, cols);
        this.rows = Math.max(1, rows);
        this.scrollBottom = this.rows - 1;
        this.events = events;
        this.initGrid();
    }
    resize(cols, rows) {
        this.cols = Math.max(1, cols);
        this.rows = Math.max(1, rows);
        this.scrollTop = 0;
        this.scrollBottom = this.rows - 1;
        this.initGrid();
        this.viewportY = this.scrollback.length;
    }
    scrollLines(delta) {
        const prev = this.viewportY;
        this.viewportY = Math.max(0, Math.min(this.scrollback.length, this.viewportY + delta));
        if (prev !== this.viewportY) {
            for (let r = 0; r < this.rows; r++)
                this.dirtyRowSet.add(r);
        }
    }
    scrollToBottom() {
        this.scrollLines(this.scrollback.length - this.viewportY);
    }
    scrollToTop() {
        this.scrollLines(-this.viewportY);
    }
    scrollToLine(line) {
        const target = Math.max(0, Math.min(this.scrollback.length, line));
        this.scrollLines(target - this.viewportY);
    }
    getVisibleLines() {
        const visible = [];
        for (let r = 0; r < this.rows; r++) {
            const idx = this.viewportY + r;
            if (idx < this.scrollback.length) {
                visible.push(this.scrollback[idx]);
            }
            else {
                const gridIdx = idx - this.scrollback.length;
                if (gridIdx < this.lines.length) {
                    visible.push(this.lines[gridIdx]);
                }
                else {
                    visible.push(this.createEmptyLine());
                }
            }
        }
        return visible;
    }
    initGrid() {
        this.lines = [];
        for (let r = 0; r < this.rows; r++) {
            this.lines.push(this.createEmptyLine());
            this.dirtyRowSet.add(r);
        }
    }
    createEmptyLine() {
        const line = new Array(this.cols);
        for (let c = 0; c < this.cols; c++) {
            line[c] = {
                char: ' ',
                width: 1,
                flags: CellFlags.EMPTY,
                fg: { type: 'default' },
                bg: { type: 'default' },
            };
        }
        return line;
    }
    feed(data) {
        const text = typeof data === 'string' ? data : new TextDecoder('utf-8').decode(data);
        this.dirtyRowSet.clear();
        const wasAtBottom = this.viewportY === this.scrollback.length;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            switch (this.state) {
                case 'GROUND':
                    if (ch === '\x1b') {
                        this.state = 'ESC';
                    }
                    else if (ch === '\r') {
                        this.cursor.col = 0;
                    }
                    else if (ch === '\n') {
                        this.lineFeed();
                    }
                    else if (ch === '\b') {
                        this.cursor.col = Math.max(0, this.cursor.col - 1);
                    }
                    else if (ch === '\t') {
                        this.cursor.col = Math.min(this.cols - 1, (this.cursor.col + 8) & ~7);
                    }
                    else if (ch === '\x07') {
                        this.events.onBell?.();
                    }
                    else if (ch >= ' ') {
                        this.printChar(ch);
                    }
                    break;
                case 'ESC':
                    if (ch === '[') {
                        this.state = 'CSI';
                        this.csiParams = '';
                    }
                    else if (ch === ']') {
                        this.state = 'OSC';
                        this.oscBuffer = '';
                    }
                    else if (ch === '7') {
                        this.savedCursor = { col: this.cursor.col, row: this.cursor.row };
                        this.state = 'GROUND';
                    }
                    else if (ch === '8') {
                        this.cursor.col = this.savedCursor.col;
                        this.cursor.row = this.savedCursor.row;
                        this.state = 'GROUND';
                    }
                    else if (ch === 'c') {
                        this.reset();
                        this.state = 'GROUND';
                    }
                    else {
                        this.state = 'GROUND';
                    }
                    break;
                case 'CSI':
                    if ((ch >= '0' && ch <= '9') || ch === ';' || ch === '?' || ch === '>') {
                        this.csiParams += ch;
                    }
                    else {
                        this.handleCsi(ch);
                        this.state = 'GROUND';
                    }
                    break;
                case 'OSC':
                    if (ch === '\x07') {
                        this.handleOsc(this.oscBuffer);
                        this.state = 'GROUND';
                    }
                    else if (ch === '\x1b') {
                        this.state = 'OSC_ESC';
                    }
                    else {
                        this.oscBuffer += ch;
                    }
                    break;
                case 'OSC_ESC':
                    if (ch === '\\') {
                        this.handleOsc(this.oscBuffer);
                        this.state = 'GROUND';
                    }
                    else {
                        this.handleOsc(this.oscBuffer);
                        this.state = 'GROUND';
                        if (ch === '[') {
                            this.state = 'CSI';
                            this.csiParams = '';
                        }
                        else if (ch === ']') {
                            this.state = 'OSC';
                            this.oscBuffer = '';
                        }
                    }
                    break;
            }
        }
        if (wasAtBottom) {
            this.viewportY = this.scrollback.length;
        }
        const dirtyRows = [];
        const visible = this.getVisibleLines();
        for (let r = 0; r < visible.length; r++) {
            if (this.dirtyRowSet.has(r) || !wasAtBottom) {
                dirtyRows.push({
                    row: r,
                    cells: [...visible[r]],
                });
            }
        }
        return {
            cols: this.cols,
            rows: this.rows,
            cursor: {
                ...this.cursor,
                visible: this.cursor.visible && this.viewportY === this.scrollback.length,
            },
            dirtyRows,
        };
    }
    printChar(ch) {
        if (this.cursor.col >= this.cols) {
            this.cursor.col = 0;
            this.lineFeed();
        }
        const r = this.cursor.row;
        const c = this.cursor.col;
        if (r < this.lines.length && c < this.cols) {
            this.lines[r][c] = {
                char: ch,
                width: 1,
                flags: this.currentFlags,
                fg: { ...this.currentFg },
                bg: { ...this.currentBg },
            };
            this.dirtyRowSet.add(r);
        }
        this.cursor.col++;
    }
    lineFeed() {
        if (this.cursor.row >= this.scrollBottom) {
            this.scrollUp(1);
        }
        else {
            this.cursor.row++;
        }
    }
    scrollUp(count) {
        for (let k = 0; k < count; k++) {
            const removed = this.lines.splice(this.scrollTop, 1)[0];
            if (removed) {
                this.scrollback.push(removed);
                if (this.scrollback.length > this.maxScrollback) {
                    this.scrollback.shift();
                }
            }
            this.lines.splice(this.scrollBottom, 0, this.createEmptyLine());
        }
        for (let r = this.scrollTop; r <= this.scrollBottom; r++) {
            this.dirtyRowSet.add(r);
        }
    }
    handleCsi(finalChar) {
        const isPrivate = this.csiParams.startsWith('?');
        const paramStr = isPrivate ? this.csiParams.slice(1) : this.csiParams;
        const args = paramStr ? paramStr.split(';').map((v) => parseInt(v, 10) || 0) : [];
        switch (finalChar) {
            case 'm': // SGR
                this.handleSgr(args);
                break;
            case 'H': // CUP
            case 'f':
                {
                    const row = (args[0] || 1) - 1;
                    const col = (args[1] || 1) - 1;
                    this.cursor.row = Math.max(0, Math.min(this.rows - 1, row));
                    this.cursor.col = Math.max(0, Math.min(this.cols - 1, col));
                }
                break;
            case 'A': // CUU
                this.cursor.row = Math.max(0, this.cursor.row - (args[0] || 1));
                break;
            case 'B': // CUD
                this.cursor.row = Math.min(this.rows - 1, this.cursor.row + (args[0] || 1));
                break;
            case 'C': // CUF
                this.cursor.col = Math.min(this.cols - 1, this.cursor.col + (args[0] || 1));
                break;
            case 'D': // CUB
                this.cursor.col = Math.max(0, this.cursor.col - (args[0] || 1));
                break;
            case 'G': // CHA
                this.cursor.col = Math.max(0, Math.min(this.cols - 1, (args[0] || 1) - 1));
                break;
            case 'd': // VPA
                this.cursor.row = Math.max(0, Math.min(this.rows - 1, (args[0] || 1) - 1));
                break;
            case 'J': // ED
                {
                    const mode = args[0] || 0;
                    if (mode === 0) {
                        // Cursor to end
                        this.clearLineRange(this.cursor.row, this.cursor.col, this.cols - 1);
                        for (let r = this.cursor.row + 1; r < this.rows; r++) {
                            this.clearLine(r);
                        }
                    }
                    else if (mode === 1) {
                        for (let r = 0; r < this.cursor.row; r++) {
                            this.clearLine(r);
                        }
                        this.clearLineRange(this.cursor.row, 0, this.cursor.col);
                    }
                    else if (mode === 2 || mode === 3) {
                        for (let r = 0; r < this.rows; r++) {
                            this.clearLine(r);
                        }
                        if (mode === 3)
                            this.scrollback = [];
                    }
                }
                break;
            case 'K': // EL
                {
                    const mode = args[0] || 0;
                    if (mode === 0) {
                        this.clearLineRange(this.cursor.row, this.cursor.col, this.cols - 1);
                    }
                    else if (mode === 1) {
                        this.clearLineRange(this.cursor.row, 0, this.cursor.col);
                    }
                    else if (mode === 2) {
                        this.clearLine(this.cursor.row);
                    }
                }
                break;
            case 'r': // DECSTBM
                {
                    const top = (args[0] || 1) - 1;
                    const bottom = (args[1] || this.rows) - 1;
                    if (top < bottom && bottom < this.rows) {
                        this.scrollTop = top;
                        this.scrollBottom = bottom;
                    }
                    else {
                        this.scrollTop = 0;
                        this.scrollBottom = this.rows - 1;
                    }
                    this.cursor.row = 0;
                    this.cursor.col = 0;
                }
                break;
            case 'h': // Set Mode
                if (isPrivate) {
                    if (args.includes(25))
                        this.cursor.visible = true;
                }
                break;
            case 'l': // Reset Mode
                if (isPrivate) {
                    if (args.includes(25))
                        this.cursor.visible = false;
                }
                break;
        }
    }
    handleSgr(args) {
        if (args.length === 0)
            args = [0];
        let i = 0;
        while (i < args.length) {
            const code = args[i++];
            if (code === 0) {
                this.currentFlags = CellFlags.EMPTY;
                this.currentFg = { type: 'default' };
                this.currentBg = { type: 'default' };
            }
            else if (code === 1)
                this.currentFlags |= CellFlags.BOLD;
            else if (code === 2)
                this.currentFlags |= CellFlags.DIM;
            else if (code === 3)
                this.currentFlags |= CellFlags.ITALIC;
            else if (code === 4)
                this.currentFlags |= CellFlags.UNDERLINE;
            else if (code === 5)
                this.currentFlags |= CellFlags.BLINK;
            else if (code === 7)
                this.currentFlags |= CellFlags.INVERSE;
            else if (code === 8)
                this.currentFlags |= CellFlags.HIDDEN;
            else if (code === 9)
                this.currentFlags |= CellFlags.STRIKETHROUGH;
            else if (code === 22)
                this.currentFlags &= ~(CellFlags.BOLD | CellFlags.DIM);
            else if (code === 23)
                this.currentFlags &= ~CellFlags.ITALIC;
            else if (code === 24)
                this.currentFlags &= ~CellFlags.UNDERLINE;
            else if (code === 25)
                this.currentFlags &= ~CellFlags.BLINK;
            else if (code === 27)
                this.currentFlags &= ~CellFlags.INVERSE;
            else if (code === 28)
                this.currentFlags &= ~CellFlags.HIDDEN;
            else if (code === 29)
                this.currentFlags &= ~CellFlags.STRIKETHROUGH;
            else if (code >= 30 && code <= 37) {
                this.currentFg = { type: 'indexed', index: code - 30 };
            }
            else if (code === 38) {
                if (args[i] === 5) {
                    this.currentFg = { type: 'indexed', index: args[i + 1] };
                    i += 2;
                }
                else if (args[i] === 2) {
                    this.currentFg = { type: 'rgb', r: args[i + 1], g: args[i + 2], b: args[i + 3] };
                    i += 4;
                }
            }
            else if (code === 39) {
                this.currentFg = { type: 'default' };
            }
            else if (code >= 40 && code <= 47) {
                this.currentBg = { type: 'indexed', index: code - 40 };
            }
            else if (code === 48) {
                if (args[i] === 5) {
                    this.currentBg = { type: 'indexed', index: args[i + 1] };
                    i += 2;
                }
                else if (args[i] === 2) {
                    this.currentBg = { type: 'rgb', r: args[i + 1], g: args[i + 2], b: args[i + 3] };
                    i += 4;
                }
            }
            else if (code === 49) {
                this.currentBg = { type: 'default' };
            }
            else if (code >= 90 && code <= 97) {
                this.currentFg = { type: 'indexed', index: code - 90 + 8 };
            }
            else if (code >= 100 && code <= 107) {
                this.currentBg = { type: 'indexed', index: code - 100 + 8 };
            }
        }
    }
    handleOsc(buffer) {
        const semiIdx = buffer.indexOf(';');
        if (semiIdx === -1)
            return;
        const ident = parseInt(buffer.slice(0, semiIdx), 10);
        const content = buffer.slice(semiIdx + 1);
        this.events.onOsc?.(ident, content);
        if (ident === 0 || ident === 2) {
            this.events.onTitle?.(content);
        }
        else if (ident === 7) {
            let url = content;
            if (url.startsWith('file://'))
                url = url.slice(7);
            const slash = url.indexOf('/');
            if (slash !== -1 && !url.startsWith('/'))
                url = url.slice(slash);
            this.events.onCwd?.(decodeURIComponent(url));
        }
    }
    clearLine(row) {
        if (row < this.lines.length) {
            this.lines[row] = this.createEmptyLine();
            this.dirtyRowSet.add(row);
        }
    }
    clearLineRange(row, startCol, endCol) {
        if (row < this.lines.length) {
            for (let c = Math.max(0, startCol); c <= Math.min(this.cols - 1, endCol); c++) {
                this.lines[row][c] = {
                    char: ' ',
                    width: 1,
                    flags: CellFlags.EMPTY,
                    fg: { type: 'default' },
                    bg: { type: 'default' },
                };
            }
            this.dirtyRowSet.add(row);
        }
    }
    reset() {
        this.currentFlags = CellFlags.EMPTY;
        this.currentFg = { type: 'default' };
        this.currentBg = { type: 'default' };
        this.cursor.col = 0;
        this.cursor.row = 0;
        this.initGrid();
        this.viewportY = this.scrollback.length;
    }
}
