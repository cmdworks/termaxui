export function decodeBinaryDiff(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 15) {
        throw new Error('Invalid TMX1 binary diff: buffer too small');
    }
    // Verify Magic: 'T', 'M', 'X', '1'
    if (bytes[0] !== 0x54 ||
        bytes[1] !== 0x4d ||
        bytes[2] !== 0x58 ||
        bytes[3] !== 0x31) {
        throw new Error('Invalid TMX1 binary diff header magic');
    }
    const cols = view.getUint16(4, true);
    const rows = view.getUint16(6, true);
    const cursorCol = view.getUint16(8, true);
    const cursorRow = view.getUint16(10, true);
    const cursorFlags = view.getUint8(12);
    const cursorVisible = (cursorFlags & 1) !== 0;
    const cursorBlinking = (cursorFlags & 2) !== 0;
    const cursorShapeRaw = (cursorFlags >> 2) & 0b11;
    let cursorShape = 'block';
    if (cursorShapeRaw === 1)
        cursorShape = 'underline';
    else if (cursorShapeRaw === 2)
        cursorShape = 'bar';
    const cursor = {
        col: cursorCol,
        row: cursorRow,
        visible: cursorVisible,
        blinking: cursorBlinking,
        shape: cursorShape,
    };
    const numDirtyRows = view.getUint16(13, true);
    const dirtyRows = [];
    let offset = 15;
    const CELL_SIZE = 15;
    for (let r = 0; r < numDirtyRows; r++) {
        if (offset + 2 > bytes.byteLength)
            break;
        const rowIdx = view.getUint16(offset, true);
        offset += 2;
        const cells = [];
        for (let c = 0; c < cols; c++) {
            if (offset + CELL_SIZE > bytes.byteLength)
                break;
            const codepoint = view.getUint32(offset, true);
            const width = view.getUint8(offset + 4);
            const flags = view.getUint16(offset + 5, true);
            const fgRaw = view.getUint32(offset + 7, true);
            const bgRaw = view.getUint32(offset + 11, true);
            offset += CELL_SIZE;
            const char = codepoint === 0 ? ' ' : String.fromCodePoint(codepoint);
            const fg = decodeColor(fgRaw);
            const bg = decodeColor(bgRaw);
            cells.push({
                char,
                width,
                flags,
                fg,
                bg,
            });
        }
        dirtyRows.push({
            row: rowIdx,
            cells,
        });
    }
    return {
        cols,
        rows,
        cursor,
        dirtyRows,
    };
}
function decodeColor(raw) {
    const tag = (raw >> 24) & 0xff;
    if (tag === 1) {
        return {
            type: 'indexed',
            index: raw & 0xff,
        };
    }
    else if (tag === 2) {
        return {
            type: 'rgb',
            r: (raw >> 16) & 0xff,
            g: (raw >> 8) & 0xff,
            b: raw & 0xff,
        };
    }
    return { type: 'default' };
}
