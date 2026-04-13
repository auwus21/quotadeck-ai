# Development Setup

This guide walks you through setting up QuotaDeck AI for local development.

## Prerequisites

### All Platforms

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | v20+ | [nodejs.org](https://nodejs.org/) |
| Rust | Latest stable | [rustup.rs](https://rustup.rs/) |
| Git | Any recent | [git-scm.com](https://git-scm.com/) |

### Windows

- **Microsoft Visual Studio C++ Build Tools** — Required for Rust compilation
  - Install via [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - Select "Desktop development with C++"
- **WebView2** — Usually pre-installed on Windows 10/11

### macOS

- **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/quotadeck-ai.git
cd quotadeck-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

```bash
npm run tauri dev
```

This starts both the Vite dev server (frontend) and the Tauri Rust backend. Hot Module Replacement (HMR) is enabled for the frontend.

### 4. Build for Production

```bash
npm run tauri build
```

The compiled binary will be in `src-tauri/target/release/`.

## Project Structure

```
quotadeck-ai/
├── src/              # React frontend (TypeScript)
├── src-tauri/        # Rust backend (Tauri)
├── docs/             # Documentation
├── .github/          # GitHub configuration
└── ...config files
```

See [Architecture Overview](../architecture/overview.md) for detailed architecture documentation.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Start development mode |
| `npm run tauri build` | Build production binary |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint linting |
| `cd src-tauri && cargo test` | Run Rust unit tests |
| `cd src-tauri && cargo clippy` | Rust linting |

## Troubleshooting

### Rust compilation fails on Windows

Ensure you have the Visual Studio C++ Build Tools installed with the "Desktop development with C++" workload.

### WebView2 not found on Windows

Download and install [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) from Microsoft.

### Permission denied on Linux

Ensure you have the required system libraries installed (see Linux prerequisites above).
