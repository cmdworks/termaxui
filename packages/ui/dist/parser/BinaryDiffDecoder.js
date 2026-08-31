export class BinaryDiffDecoder {
    static decode(buffer) {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        if (bytes.length < 15)
            return null;
        // Check magic b"TMX1"
        if (bytes[0] !== 0x54 || // 'T'
            bytes[1] !== 0x4d || // 'M'
            bytes[2] !== 0x58 || // 'X'
            bytes[3] !== 0x31 // '1'
        ) {
            return null;
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const cols = view.getUint16(4, true);
        const rows = view.getUint16(6, true);
        const cursorCol = view.getUint16(8, true);
        const cursorRow = view.getUint16(10, true);
        const flags = view.getUint8(12);
        const cursorVisible = (flags & (1 << 0)) !== 0;
        const cursorBlinking = (flags & (1 << 1)) !== 0;
        const shapeVal = (flags >> 2) & 0x07;
        let cursorShape = 'block';
        if (shapeVal === 1)
            cursorShape = 'underline';
        else if (shapeVal === 2)
            cursorShape = 'bar';
        const numDirtyRows = view.getUint16(13, true);
        let offset = 15;
        const dirtyRows = [];
        for (let i = 0; i < numDirtyRows; i++) {
            if (offset + 2 > bytes.length)
                break;
            const rowIdx = view.getUint16(offset, true);
            offset += 2;
            const cells = [];
            for (let c = 0; c < cols; c++) {
                if (offset + 15 > bytes.length)
                    break;
                const codepoint = view.getUint32(offset, true);
                const width = view.getUint8(offset + 4);
                const cellFlags = view.getUint16(offset + 5, true);
                const fgType = view.getUint8(offset + 7);
                let fg = { type: 'default' };
                if (fgType === 1) {
                    fg = { type: 'indexed', index: view.getUint8(offset + 8) };
                }
                else if (fgType === 2) {
                    fg = {
                        type: 'rgb',
                        r: view.getUint8(offset + 8),
                        g: view.getUint8(offset + 9),
                        b: view.getUint8(offset + 10),
                    };
                }
                const bgType = view.getUint8(offset + 11);
                let bg = { type: 'default' };
                if (bgType === 1) {
                    bg = { type: 'indexed', index: view.getUint8(offset + 12) };
                }
                else if (bgType === 2) {
                    bg = {
                        type: 'rgb',
                        r: view.getUint8(offset + 12),
                        g: view.getUint8(offset + 13),
                        b: view.getUint8(offset + 14),
                    };
                }
                offset += 15;
                cells.push({
                    char: codepoint > 0 ? String.fromCodePoint(codepoint) : ' ',
                    width,
                    flags: cellFlags,
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
            cursor: {
                col: cursorCol,
                row: cursorRow,
                visible: cursorVisible,
                blinking: cursorBlinking,
                shape: cursorShape,
            },
            dirtyRows,
        };
    }
}
