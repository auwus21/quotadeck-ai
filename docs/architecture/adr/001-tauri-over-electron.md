# ADR-001: Tauri v2 over Electron

## Status

Accepted

## Date

2026-04-13

## Context

We needed to choose a desktop application framework for QuotaDeck AI. The two main contenders were **Electron** and **Tauri v2**.

Our requirements:
- Cross-platform (Windows, macOS, Linux)
- Access to filesystem for reading/writing IDE configuration files
- Secure local storage for authentication tokens
- Small bundle size for easy distribution
- Low memory footprint for background monitoring

## Decision

We chose **Tauri v2** with a Rust backend.

## Rationale

| Metric | Electron | Tauri v2 |
|--------|----------|----------|
| Bundle Size | ~80-200 MB | ~3-15 MB |
| Memory Usage (idle) | ~150-400 MB | ~30-80 MB |
| Cold Start | ~1.5-5s | < 0.5s |
| Backend | Node.js | Rust (compiled) |
| Security | Full Node.js access | Sandboxed, explicit permissions |

Key factors:
1. **Performance**: QuotaDeck AI runs as a background monitor. Low memory usage is critical.
2. **Security**: Tauri's permission model ensures the frontend cannot access the filesystem without explicit backend commands — important when handling auth tokens.
3. **Distribution**: A ~5MB installer is significantly easier to distribute than a ~150MB one.
4. **Mobile future**: Tauri v2 supports iOS and Android compilation.

## Trade-offs

- Rust has a steeper learning curve than Node.js
- Smaller ecosystem of plugins compared to Electron
- System WebView rendering may have minor inconsistencies across OS versions

## Consequences

- Backend logic must be written in Rust
- Frontend communicates with backend via Tauri's IPC (invoke/listen pattern)
- We must handle platform-specific WebView quirks
