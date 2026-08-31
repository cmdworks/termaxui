export class GlyphAtlas {
    width = 2048;
    height = 2048;
    canvas = null;
    ctx = null;
    glyphCache = new Map();
    nextX = 0;
    nextY = 0;
    rowHeight = 0;
    dpr = 1;
    isDirty = false;
    constructor(dpr = 1) {
        this.dpr = dpr;
        if (typeof document !== 'undefined') {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            if (this.ctx) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
        }
    }
    getCanvas() {
        return this.canvas;
    }
    getGlyph(char, font, fontSize, charWidth, charHeight) {
        const key = `${char}_${font}_${fontSize}`;
        const cached = this.glyphCache.get(key);
        if (cached)
            return cached;
        return this.rasterizeGlyph(char, font, fontSize, charWidth, charHeight, key);
    }
    rasterizeGlyph(char, font, fontSize, charWidth, charHeight, key) {
        const glyphW = Math.ceil(charWidth * this.dpr);
        const glyphH = Math.ceil(charHeight * this.dpr);
        if (this.nextX + glyphW > this.width) {
            this.nextX = 0;
            this.nextY += this.rowHeight + 2;
            this.rowHeight = 0;
        }
        if (this.nextY + glyphH > this.height) {
            // Atlas is full; reset
            this.clear();
        }
        const x = this.nextX;
        const y = this.nextY;
        this.nextX += glyphW + 2;
        this.rowHeight = Math.max(this.rowHeight, glyphH);
        if (this.ctx) {
            this.ctx.save();
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x, y, glyphW, glyphH);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${fontSize * this.dpr}px ${font}`;
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(char, x, y + glyphH / 2);
            this.ctx.restore();
            this.isDirty = true;
        }
        const location = {
            u0: x / this.width,
            v0: y / this.height,
            u1: (x + glyphW) / this.width,
            v1: (y + glyphH) / this.height,
            width: charWidth,
            height: charHeight,
        };
        this.glyphCache.set(key, location);
        return location;
    }
    clear() {
        this.glyphCache.clear();
        this.nextX = 0;
        this.nextY = 0;
        this.rowHeight = 0;
        if (this.ctx) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.isDirty = true;
        }
    }
}
