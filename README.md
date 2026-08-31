# TermaxUI

[![CI](https://github.com/cmdworks/termaxui/actions/workflows/ci.yml/badge.svg)](https://github.com/cmdworks/termaxui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Dual-target terminal emulator engine in Rust: native (Tauri / Termax) + web (WASM), sharing one high-performance core.**

---

## Highlights

- **Shared Rust Core (`crates/core`)**: Single platform-agnostic VT parser (`vte`), grid model, scrollback ring buffer, and dirty-row diff engine.
- **Zero-Copy Native Bridge (`crates/tauri-bridge`)**: In-process PTY stream with compact binary row diffs (`TMX1`) over Tauri Channels.
- **Browser-Ready Web Bridge (`crates/wasm-bridge`)**: `wasm-bindgen` exports for web playgrounds and browser tools.
- **xterm.js Drop-in Compatibility (`packages/ui`)**: Compatible with existing addons (`FitAddon`, `SearchAddon`, `WebLinksAddon`).
- **DEC 2026 Synchronized Output**: Zero tearing during high-throughput AI agent outputs.
- **Native Shell & Agent Signals**: Built-in parsing for `OSC 7` (cwd), `OSC 133` (prompt boundaries), and `OSC 777` (agent signals).

---

## Monorepo Layout

```
termaxui/
├── crates/
│   ├── core/           # VT parser, grid, scrollback, dirty-row diff (wasm32-compatible)
│   ├── tauri-bridge/   # Direct PTY integration + Tauri Channel binary diff streamer
│   └── wasm-bridge/    # wasm-bindgen bindings & xterm.js API surface
├── packages/
│   └── ui/             # TypeScript renderer (Canvas 2D / WebGL) + Addon system
│       └── src/
│           ├── adapters/   # TauriTransport & WasmTransport
│           ├── addons/     # FitAddon, SearchAddon, WebLinksAddon
│           ├── renderer/   # CanvasRenderer
│           └── protocol.ts # TMX1 binary protocol decoder
├── demo/               # Interactive browser playground
└── docs/               # Architecture and migration guides
```

---

## Quickstart

### Build Rust Crates
```bash
cargo build --workspace
cargo test --workspace
```

### Typecheck & Test Frontend
```bash
cd packages/ui
pnpm check-types
pnpm test
```

### Run Playground Demo
```bash
# Open demo/index.html in any browser
open demo/index.html
```

---

## License

MIT License.
