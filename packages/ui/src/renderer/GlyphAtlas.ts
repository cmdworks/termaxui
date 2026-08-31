export interface GlyphLocation {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  width: number;
  height: number;
}

export class GlyphAtlas {
  public readonly width = 2048;
  public readonly height = 2048;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private glyphCache: Map<string, GlyphLocation> = new Map();

  private nextX = 0;
  private nextY = 0;
  private rowHeight = 0;
  private dpr = 1;
  public isDirty = false;

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

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  public getGlyph(
    char: string,
    font: string,
    fontSize: number,
    charWidth: number,
    charHeight: number
  ): GlyphLocation {
    const key = `${char}_${font}_${fontSize}`;
    const cached = this.glyphCache.get(key);
    if (cached) return cached;

    return this.rasterizeGlyph(char, font, fontSize, charWidth, charHeight, key);
  }

  private rasterizeGlyph(
    char: string,
    font: string,
    fontSize: number,
    charWidth: number,
    charHeight: number,
    key: string
  ): GlyphLocation {
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

    const location: GlyphLocation = {
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

  public clear(): void {
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
