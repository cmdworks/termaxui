import { describe, it, expect } from 'vitest';
import { decodeBinaryDiff } from './protocol.js';

describe('decodeBinaryDiff', () => {
  it('should throw on invalid buffer or header', () => {
    const tooSmall = new Uint8Array([1, 2, 3, 4]);
    expect(() => decodeBinaryDiff(tooSmall)).toThrow(/Invalid TMX1 binary diff/);

    const badMagic = new Uint8Array(15);
    expect(() => decodeBinaryDiff(badMagic)).toThrow(/Invalid TMX1 binary diff/);
  });

  it('should parse a minimal valid TMX1 packet', () => {
    // 15 bytes header:
    // Magic: 'T', 'M', 'X', '1' (0x54, 0x4D, 0x58, 0x31)
    // cols: 80 (0x50, 0x00)
    // rows: 24 (0x18, 0x00)
    // cursorCol: 0 (0x00, 0x00)
    // cursorRow: 0 (0x00, 0x00)
    // cursorFlags: 1 (visible)
    // numDirtyRows: 0 (0x00, 0x00)
    const packet = new Uint8Array([
      0x54, 0x4d, 0x58, 0x31,
      0x50, 0x00,
      0x18, 0x00,
      0x00, 0x00,
      0x00, 0x00,
      0x01,
      0x00, 0x00,
    ]);
    const decoded = decodeBinaryDiff(packet);
    expect(decoded.cols).toBe(80);
    expect(decoded.rows).toBe(24);
    expect(decoded.cursor.col).toBe(0);
    expect(decoded.cursor.row).toBe(0);
    expect(decoded.cursor.visible).toBe(true);
    expect(decoded.dirtyRows.length).toBe(0);
  });
});
