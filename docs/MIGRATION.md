# Migrating from xterm.js to TermaxUI

TermaxUI provides an `xterm.js`-shaped API surface designed as a drop-in replacement with higher rendering throughput, zero JSON IPC overhead, and native Rust parsing.

---

## 1. Package Installation

```bash
# Remove legacy xterm.js
pnpm remove @xterm/xterm @xterm/addon-webgl

# Install TermaxUI
pnpm add @termaxui/ui
```

---

## 2. Instantiation & Setup

### Before (xterm.js):
```typescript
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const term = new Terminal({
  cols: 80,
  rows: 24,
  theme: { background: '#0f1217', foreground: '#e6edf3' }
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal-container')!);
fitAddon.fit();
```

### After (TermaxUI):
```typescript
import { Terminal, FitAddon, TauriTransport } from '@termaxui/ui';

const term = new Terminal({
  cols: 80,
  rows: 24,
  theme: { background: '#0f1217', foreground: '#e6edf3' }
});

// Configure high-performance binary transport
const transport = new TauriTransport({
  sendInput: (data) => invoke('pty_write', { id, data }),
  sendResize: (cols, rows) => invoke('pty_resize', { id, cols, rows }),
  subscribeDiffs: (callback) => {
    // Listen to binary TMX1 channel emissions
    return ptyChannel.on('diff', callback);
  }
});
term.setTransport(transport);

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal-container')!);
fitAddon.fit();
```

---

## 3. Web & WASM Usage (Browser Only)

```typescript
import { Terminal, WasmTransport } from '@termaxui/ui';
import { WasmTerminal } from '@termaxui/wasm';

const wasmTerm = new WasmTerminal(80, 24);
const transport = new WasmTransport(wasmTerm);

const term = new Terminal();
term.setTransport(transport);
term.open(document.getElementById('terminal')!);
```

---

## 4. Key Benefits

- **Zero JSON IPC Serialization**: Row diffs are streamed as compact `TMX1` binary buffers.
- **In-Process Parsing**: PTY bytes are parsed in the native Rust process via `vte` and `portable-pty`.
- **Integrated Shell Protocols**: Native tracking of `OSC 7` (cwd), `OSC 133` (prompt markers), and `OSC 777` (agent signals).
- **Synchronized Output**: Full support for `DEC 2026` batch updates without screen tearing.
