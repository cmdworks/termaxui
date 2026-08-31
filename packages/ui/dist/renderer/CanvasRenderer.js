import { CellFlags, } from '../types.js';
const DEFAULT_PALETTE = [
    '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
    '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff',
];
export class CanvasRenderer {
    canvas;
    ctx;
    charWidth = 9;
    charHeight = 18;
    dpr = 1;
    selection = null;
    searchMatches = [];
    hoveredLink = null;
    images = [];
    scrollProgress = null;
    scrollbarFadeTimer = null;
    scrollbarAlpha = 0;
    grid = [];
    cursor = {
        col: 0,
        row: 0,
        visible: true,
        blinking: true,
        shape: 'block',
    };
    options;
    palette = [];
    constructor(options = {}) {
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
        if (typeof document !== 'undefined') {
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'xterm-screen-canvas';
            this.canvas.style.display = 'block';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            const ctx = this.canvas.getContext('2d', { alpha: false });
            this.ctx = ctx || {};
        }
        else {
            this.canvas = {};
            this.ctx = {};
        }
        this.initPalette(this.options.theme || {});
        this.initGrid(this.options.cols || 80, this.options.rows || 24);
        if (typeof document !== 'undefined') {
            this.measureFont();
            this.resizeCanvas();
        }
    }
    attach(container) {
        if (typeof document === 'undefined')
            return;
        container.style.position = 'relative';
        container.appendChild(this.canvas);
        this.measureFont();
        this.resizeCanvas();
        this.renderAll();
    }
    updateTheme(theme) {
        this.options.theme = theme;
        this.initPalette(theme);
        this.renderAll();
    }
    setSelection(selection) {
        this.selection = selection;
        this.renderAll();
    }
    setSearchMatches(matches) {
        this.searchMatches = matches;
        this.renderAll();
    }
    setHoveredLink(link) {
        this.hoveredLink = link;
        this.renderAll();
    }
    setImages(images) {
        this.images = images;
        this.renderAll();
    }
    updateScroll(viewportY, totalLines) {
        this.scrollProgress = { viewportY, totalLines };
        this.scrollbarAlpha = 1.0;
        if (this.scrollbarFadeTimer)
            clearTimeout(this.scrollbarFadeTimer);
        this.scrollbarFadeTimer = setTimeout(() => {
            this.scrollbarAlpha = 0;
            this.renderAll();
        }, 1200);
        this.renderAll();
    }
    resize(cols, rows) {
        this.options.cols = cols;
        this.options.rows = rows;
        this.initGrid(cols, rows);
        if (typeof document !== 'undefined') {
            this.measureFont();
            this.resizeCanvas();
            this.renderAll();
        }
    }
    applyDiff(diff) {
        let resized = false;
        if (diff.cols !== (this.options.cols || 80) || diff.rows !== (this.options.rows || 24)) {
            this.options.cols = diff.cols;
            this.options.rows = diff.rows;
            this.initGrid(diff.cols, diff.rows);
            if (typeof document !== 'undefined') {
                this.measureFont();
                this.resizeCanvas();
            }
            resized = true;
        }
        const prevCursorRow = this.cursor.row;
        this.cursor = diff.cursor;
        for (const dirtyRow of diff.dirtyRows) {
            if (dirtyRow.row < this.grid.length) {
                this.grid[dirtyRow.row] = dirtyRow.cells;
                if (!resized && typeof document !== 'undefined') {
                    this.renderRow(dirtyRow.row);
                }
            }
        }
        if (typeof document !== 'undefined') {
            if (resized) {
                this.renderAll();
            }
            else {
                if (prevCursorRow !== this.cursor.row && prevCursorRow < this.grid.length) {
                    this.renderRow(prevCursorRow);
                }
                if (this.cursor.row < this.grid.length) {
                    this.renderRow(this.cursor.row);
                }
            }
        }
    }
    initGrid(cols, rows) {
        const prevGrid = this.grid;
        this.grid = new Array(rows);
        for (let r = 0; r < rows; r++) {
            this.grid[r] = new Array(cols);
            for (let c = 0; c < cols; c++) {
                if (prevGrid && prevGrid[r] && prevGrid[r][c]) {
                    this.grid[r][c] = prevGrid[r][c];
                }
                else {
                    this.grid[r][c] = {
                        char: ' ',
                        width: 1,
                        flags: CellFlags.EMPTY,
                        fg: { type: 'default' },
                        bg: { type: 'default' },
                    };
                }
            }
        }
    }
    initPalette(theme) {
        this.palette = [...DEFAULT_PALETTE];
        if (theme.black)
            this.palette[0] = theme.black;
        if (theme.red)
            this.palette[1] = theme.red;
        if (theme.green)
            this.palette[2] = theme.green;
        if (theme.yellow)
            this.palette[3] = theme.yellow;
        if (theme.blue)
            this.palette[4] = theme.blue;
        if (theme.magenta)
            this.palette[5] = theme.magenta;
        if (theme.cyan)
            this.palette[6] = theme.cyan;
        if (theme.white)
            this.palette[7] = theme.white;
        if (theme.brightBlack)
            this.palette[8] = theme.brightBlack;
        if (theme.brightRed)
            this.palette[9] = theme.brightRed;
        if (theme.brightGreen)
            this.palette[10] = theme.brightGreen;
        if (theme.brightYellow)
            this.palette[11] = theme.brightYellow;
        if (theme.brightBlue)
            this.palette[12] = theme.brightBlue;
        if (theme.brightMagenta)
            this.palette[13] = theme.brightMagenta;
        if (theme.brightCyan)
            this.palette[14] = theme.brightCyan;
        if (theme.brightWhite)
            this.palette[15] = theme.brightWhite;
    }
    measureFont() {
        if (typeof document === 'undefined')
            return;
        this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const fontSize = this.options.fontSize || 14;
        const fontFamily = this.options.fontFamily || 'monospace';
        const lineHeight = this.options.lineHeight || 1.2;
        if (this.ctx && this.ctx.font !== undefined) {
            this.ctx.font = `${fontSize}px ${fontFamily}`;
            const metrics = this.ctx.measureText?.('W');
            const measured = metrics ? Math.ceil(metrics.width) : 0;
            this.charWidth = (measured > 0 ? measured : Math.ceil(fontSize * 0.6)) || 9;
        }
        else {
            this.charWidth = Math.ceil(fontSize * 0.6) || 9;
        }
        this.charHeight = Math.ceil(fontSize * lineHeight) || 18;
    }
    resizeCanvas() {
        if (typeof document === 'undefined')
            return;
        this.measureFont();
        this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const cols = this.options.cols || 80;
        const rows = this.options.rows || 24;
        const width = cols * this.charWidth;
        const height = rows * this.charHeight;
        const physicalWidth = Math.max(1, Math.ceil(width * this.dpr));
        const physicalHeight = Math.max(1, Math.ceil(height * this.dpr));
        if (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight) {
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;
        }
        if (this.ctx.setTransform) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(this.dpr, this.dpr);
            this.ctx.textBaseline = 'middle';
        }
    }
    renderAll() {
        if (typeof document === 'undefined')
            return;
        this.resizeCanvas();
        const cols = this.options.cols || 80;
        const rows = this.options.rows || 24;
        const width = cols * this.charWidth;
        const height = rows * this.charHeight;
        if (this.ctx.fillRect) {
            this.ctx.fillStyle = this.options.theme?.background || '#0e0e0f';
            this.ctx.fillRect(0, 0, width, height);
            for (let r = 0; r < this.grid.length; r++) {
                this.renderRow(r);
            }
            this.renderImages();
            this.renderScrollbar();
        }
    }
    isCellSelected(col, row) {
        if (!this.selection)
            return false;
        let sRow = this.selection.start.row;
        let sCol = this.selection.start.col;
        let eRow = this.selection.end.row;
        let eCol = this.selection.end.col;
        if (sRow > eRow || (sRow === eRow && sCol > eCol)) {
            const tR = sRow;
            sRow = eRow;
            eRow = tR;
            const tC = sCol;
            sCol = eCol;
            eCol = tC;
        }
        if (row < sRow || row > eRow)
            return false;
        if (sRow === eRow)
            return col >= sCol && col <= eCol;
        if (row === sRow)
            return col >= sCol;
        if (row === eRow)
            return col <= eCol;
        return true;
    }
    getSearchMatch(col, row) {
        return this.searchMatches.find((m) => m.row === row && col >= m.startCol && col <= m.endCol);
    }
    isLinkHovered(col, row) {
        if (!this.hoveredLink)
            return false;
        return (this.hoveredLink.row === row &&
            col >= this.hoveredLink.startCol &&
            col <= this.hoveredLink.endCol);
    }
    renderRow(row) {
        if (typeof document === 'undefined')
            return;
        const cells = this.grid[row];
        if (!cells)
            return;
        const y = row * this.charHeight;
        const height = this.charHeight;
        const defaultBg = this.options.theme?.background || '#0e0e0f';
        const defaultFg = this.options.theme?.foreground || '#e2e2e3';
        const selectionBg = this.options.theme?.selectionBackground || 'rgba(255, 255, 255, 0.25)';
        const selectionFg = this.options.theme?.selectionForeground;
        for (let col = 0; col < cells.length; col++) {
            const cell = cells[col];
            if (cell.width === 0)
                continue;
            const x = col * this.charWidth;
            const width = cell.width * this.charWidth;
            const selected = this.isCellSelected(col, row);
            const searchMatch = this.getSearchMatch(col, row);
            const linkHovered = this.isLinkHovered(col, row);
            const isInverse = (cell.flags & CellFlags.INVERSE) !== 0;
            let bgStyle = selected ? selectionBg : this.resolveColor(cell.bg, defaultBg);
            let fgStyle = selected && selectionFg ? selectionFg : this.resolveColor(cell.fg, defaultFg);
            if (searchMatch) {
                bgStyle = searchMatch.active
                    ? (this.options.theme?.activeMatchBackground || '#e06c75')
                    : (this.options.theme?.matchBackground || '#e5c07b');
                fgStyle = '#000000';
            }
            if (isInverse && !selected && !searchMatch) {
                const tmp = bgStyle;
                bgStyle = fgStyle;
                fgStyle = tmp;
            }
            // Draw background if not default
            if (bgStyle !== defaultBg && this.ctx.fillRect) {
                this.ctx.fillStyle = bgStyle;
                this.ctx.fillRect(x, y, width, height);
            }
            if (cell.char && cell.char !== ' ' && this.ctx.fillText) {
                this.ctx.fillStyle = fgStyle;
                let fontStyle = '';
                if (cell.flags & CellFlags.BOLD)
                    fontStyle += 'bold ';
                if (cell.flags & CellFlags.ITALIC)
                    fontStyle += 'italic ';
                this.ctx.font = `${fontStyle}${this.options.fontSize || 14}px ${this.options.fontFamily || 'monospace'}`;
                this.ctx.fillText(cell.char, x, y + height / 2);
            }
            // Underline / Strikethrough
            if (this.ctx.fillRect) {
                if (cell.flags & CellFlags.UNDERLINE || linkHovered) {
                    this.ctx.fillStyle = fgStyle;
                    this.ctx.fillRect(x, y + height - 2, width, 1);
                }
                if (cell.flags & CellFlags.STRIKETHROUGH) {
                    this.ctx.fillStyle = fgStyle;
                    this.ctx.fillRect(x, y + height / 2, width, 1);
                }
            }
        }
        // Render cursor if on this row
        if (this.cursor.visible && this.cursor.row === row && this.ctx.fillRect) {
            const cx = this.cursor.col * this.charWidth;
            const cy = this.cursor.row * this.charHeight;
            const cursorColor = this.options.theme?.cursor || '#ffffff';
            this.ctx.fillStyle = cursorColor;
            if (this.cursor.shape === 'block') {
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillRect(cx, cy, this.charWidth, this.charHeight);
                this.ctx.globalAlpha = 1.0;
            }
            else if (this.cursor.shape === 'bar') {
                this.ctx.fillRect(cx, cy, 2, this.charHeight);
            }
            else if (this.cursor.shape === 'underline') {
                this.ctx.fillRect(cx, cy + this.charHeight - 2, this.charWidth, 2);
            }
        }
    }
    renderImages() {
        if (this.images.length === 0 || !this.ctx.drawImage)
            return;
        for (const img of this.images) {
            const x = img.col * this.charWidth;
            const y = img.row * this.charHeight;
            const w = img.width;
            const h = img.height;
            if (img.data) {
                try {
                    this.ctx.drawImage(img.data, x, y, w, h);
                }
                catch { }
            }
        }
    }
    renderScrollbar() {
        if (!this.scrollProgress || this.scrollbarAlpha <= 0 || !this.ctx.fillRect)
            return;
        const { viewportY, totalLines } = this.scrollProgress;
        const rows = this.options.rows || 24;
        if (totalLines <= rows)
            return;
        const canvasHeight = rows * this.charHeight;
        const canvasWidth = (this.options.cols || 80) * this.charWidth;
        const barWidth = 6;
        const thumbHeight = Math.max(20, (rows / totalLines) * canvasHeight);
        const thumbY = (viewportY / (totalLines - rows)) * (canvasHeight - thumbHeight);
        this.ctx.save?.();
        if (this.ctx) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * this.scrollbarAlpha})`;
            this.ctx.fillRect(canvasWidth - barWidth - 2, thumbY, barWidth, thumbHeight);
        }
        this.ctx.restore?.();
    }
    resolveColor(color, fallback) {
        if (color.type === 'rgb' && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            return `rgb(${color.r},${color.g},${color.b})`;
        }
        else if (color.type === 'indexed' && color.index !== undefined) {
            return this.palette[color.index] || fallback;
        }
        return fallback;
    }
}
