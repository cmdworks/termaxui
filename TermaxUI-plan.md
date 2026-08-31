# TermaxUI — Build Plan

Dual-target terminal emulator engine: native (Tauri/Termax) + web (WASM, ghostty-web-style), sharing one Rust core.

---

## 1. Goals

- One VT100/xterm parser and grid engine (`core`), reused by a native Tauri bridge and a WASM/browser bridge.
- xterm.js-API-compatible frontend so Termax and third-party consumers migrate without rewrites.
- No WASM boundary cost in the native (Tauri) path — parsing happens in-process, diffs streamed over IPC.
- Standalone open-source repo, with Termax as the flagship native consumer.

---

## 2. Repository Layout

```
termaxui/
├── crates/
│   ├── core/            # VT parser, grid, scrollback, dirty-row diff — platform-agnostic
│   ├── wasm-bridge/      # wasm-bindgen exports, xterm.js-shaped JS API
│   └── tauri-bridge/     # Tauri Channel emitter, direct core access, PTY glue
├── packages/
│   └── ui/               # React/TS renderer (WebGL + Canvas + DOM painters), addon system
│       └── adapters/
│           ├── web.ts    # wasm-bridge glue
│           └── tauri.ts  # tauri invoke/listen glue
├── demo/                  # browser-only playground (simulated backend)
└── docs/
```

---

## 3. Required Skills

### Rust (core + bridges)
- Parser/state machine design — `vte` crate (or reading Alacritty's/Ghostty's parser source for reference) for VT100/ANSI escape sequence tokenizing.
- Terminal grid modeling: cell buffers, scrollback ring buffer, alternate screen, cursor state, SGR attribute tracking, wide-character/grapheme handling.
- `no_std`-friendly or dependency-light design discipline — keep `core` free of OS threads, `tokio`, or process APIs so it compiles cleanly to `wasm32-unknown-unknown`.
- `wasm-bindgen` / `wasm-pack` for exposing Rust structs/functions to JS with minimal boundary-crossing overhead (batch calls, avoid per-cell calls).
- Tauri 2 internals: Channels vs `invoke`, binary vs JSON payload tradeoffs, async command handlers.
- Unicode handling in Rust: `unicode-width`, `unicode-segmentation` crates for grapheme clustering and wide-char widths (CJK, emoji, Devanagari).
- Cargo workspace management: multi-crate builds, per-crate target overrides, feature flags to gate platform-specific code paths.

### Frontend (TypeScript/React)
- Canvas 2D and WebGL rendering fundamentals — glyph atlases, dirty-rect/dirty-row repaint strategies, frame scheduling via `requestAnimationFrame`.
- DOM-based rendering as an alternate accessibility mode (real text nodes for selection/copy/find/screen-reader support), and the tradeoffs vs Canvas/WebGL performance.
- xterm.js addon architecture (`ITerminalAddon` interface) — needed to build a compatibility shim so existing addons (fit, search, web-links) keep working.
- Designing a transport-agnostic adapter interface (`TerminalTransport`) so the same UI package can consume either a WASM binding or Tauri IPC events.
- Binary/structured diff protocols — decoding compact row-diff payloads efficiently in JS without excessive allocation.

### Systems/Testing
- Writing conformance tests against known VT100/xterm escape sequence behavior (cursor movement, scroll regions, OSC 7/133/777, SGR, alternate screen, synchronized-output mode 2026).
- Benchmarking methodology: isolating parser throughput from render throughput, measuring IO/reflow/render separately (as done in public Ghostty vs xterm.js comparisons), and running inside the actual Tauri webview, not just a browser tab.
- CI setup for a multi-target Rust workspace: run tests for native target and `wasm32-unknown-unknown` target separately.

### Domain knowledge (learn as you go)
- ANSI/VT100/VT220 escape sequence reference (control sequences, OSC codes, DEC private modes).
- How shell integration protocols work: OSC 7 (cwd), OSC 133 (prompt boundaries), OSC 777 (custom agent signals) — you already have working versions of these in Termax's Rust PTY module; port the logic into `core` rather than duplicating it.
- Grapheme clustering / East Asian Width tables — needed for correct cursor advancement on wide characters.

---

## 4. Build Phases

### Phase 0 — Extraction and baseline (1–2 weeks)
- Stand up the Cargo workspace (`core`, `wasm-bridge`, `tauri-bridge`).
- Extract existing VT-handling logic from `src-tauri/modules/pty` into `core`, replacing ad hoc parsing with `vte::Parser`.
- Write a conformance test suite covering Termax's current behavior (OSC 7/133/777, cursor ops, SGR, alt-screen) before any refactor — this is your regression safety net.

### Phase 1 — Native path first (2–4 weeks)
- Build `tauri-bridge`: feed PTY bytes into `core`, compute dirty-row diffs, stream over a Tauri `Channel` (binary payload, not JSON).
- Wire `packages/ui`'s `tauri.ts` adapter to consume these diffs and paint via the existing WebGL renderer.
- Get Termax itself running end-to-end on the new engine. Do not touch WASM yet — this validates the core parser/grid logic in production before adding platform complexity.
- Benchmark against the current xterm.js-based Termax build (IO throughput, reflow time, frame time) inside the actual Tauri webview on macOS and Windows.

### Phase 2 — WASM path (2–3 weeks)
- Add `wasm-bridge`: `wasm-bindgen` exports mirroring the xterm.js `Terminal` API surface (`write`, `resize`, `onData`, buffer accessors).
- Minimize boundary crossings: batch updates, bulk row retrieval, dirty-row tracking on the Rust side so JS only pulls changed rows.
- Run the same conformance test suite from Phase 0 against the WASM build to confirm parity with the native path.
- Build the `demo/` browser playground (simulated PTY, no real backend) for public showcasing.

### Phase 3 — Compatibility and polish (2–3 weeks)
- Build the `xterm-compat.ts` shim mapping legacy addon calls (fit, search, web-links, unicode11) onto the new API.
- Add DOM-rendering mode as an accessibility option alongside WebGL/Canvas.
- Implement synchronized-output mode (DEC 2026) to prevent render tearing during large agent output bursts.
- Write migration docs for swapping xterm.js → TermaxUI in an existing project.

### Phase 4 — Open-source release
- Split `packages/ui` + `wasm-bridge` + `demo` into the standalone public `termaxui` repo (or keep monorepo, publish packages independently).
- Publish native crate docs for `tauri-bridge` so other Tauri app authors can adopt it directly.
- Set up CI matrix: native test job + `wasm32-unknown-unknown` build/test job, `cargo clippy --all-targets --locked`, `cargo fmt`, frontend `pnpm check-types` / `pnpm lint` / `pnpm test` — consistent with Termax's existing quality gates.

---

## 5. Key Risks to Track

- **Grapheme/Unicode correctness** is the hardest part to get fully right — budget extra time here rather than underestimating it.
- **WASM CSP restrictions**: confirm Tauri's webview CSP allows `wasm-unsafe-eval` if `wasm-bridge` is ever loaded inside the Tauri app itself (e.g., for a shared demo mode).
- **Benchmark honestly**: public comparisons of Ghostty's parser vs xterm.js were noisy due to JIT variance; always benchmark your own build in your own runtime environment before trusting external numbers.
- **Scope creep**: resist rebuilding a full terminal app — `core` should stay a parser/grid library, not grow application-level features (tabs, panes, themes stay in Termax/`packages/ui` consumers).

---

## 6. Definition of Done (v1)

- [ ] `core` passes full VT100/xterm conformance suite on both native and `wasm32-unknown-unknown` targets.
- [ ] Termax runs on `tauri-bridge` in production with equal or better IO/reflow/render benchmarks than the current xterm.js WebGL setup.
- [ ] Public browser demo runs entirely on `wasm-bridge`, no backend required.
- [ ] `xterm-compat.ts` shim passes existing Termax addon test suite unmodified.
- [ ] CI green on native + WASM targets, matching Termax's existing lint/test/clippy gates.
