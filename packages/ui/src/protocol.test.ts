import { describe, expect, it } from 'vitest';
import { decodeBinaryDiff } from './protocol';

describe('decodeBinaryDiff', () => {
  it('should throw on invalid header', () => {
    const invalid = new Uint8Array([1, 2, 3, 4]);
    expect(() => decodeBinaryDiff(invalid)).toThrow('Invalid TMX1 binary diff header');
  });

  it('should parse a minimal valid TMX1 packet', () => {
    // Magic "TMX1"
    const buf = new Uint8Array(15);
    buf[0] = 0x54;
    buf[1] = 0x4d;
    buf[2] = 0x58;
    buf[3] = 0x31;

    // cols: 10 (u16 LE)
    buf[4] = 10;
    buf[5] = 0;

    // rows: 5 (u16 LE)
    buf[6] = 5;
    buf[7] = 0;

    // cursor_x: 2 (u16 LE)
    buf[8] = 2;
    buf[9] = 0;

    // cursor_y: 3 (u16 LE)
    buf[10] = 3;
    buf[11] = 0;

    // flags: visible (1) + blinking (2) + shape 0 (block)
    buf[12] = 3;

    // num_dirty_rows: 0 (u16 LE)
    buf[13] = 0;
    buf[14] = 0;

    const diff = decodeBinaryDiff(buf);
    expect(diff.cols).toBe(10);
    expect(diff.rows).toBe(5);
    expect(diff.cursor.col).toBe(2);
    expect(diff.cursor.row).toBe(3);
    expect(diff.cursor.visible).toBe(true);
    expect(diff.cursor.blinking).toBe(true);
    expect(diff.cursor.shape).toBe('block');
    expect(diff.dirtyRows).toHaveLength(0);
  });
});
