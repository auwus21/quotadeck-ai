# Architecture Overview

## System Architecture

QuotaDeck AI follows a layered architecture with clear separation between the frontend UI and the native backend.

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Dashboard │  │ Accounts │  │   Settings    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │           │
│  Components ← Hooks ← Zustand Stores            │
│       │              │               │           │
│  ─────┴──────────────┴───────────────┴─────────  │
│              Tauri IPC Service Layer              │
│         (invoke commands, listen events)          │
└──────────────────────┬──────────────────────────-┘
                       │
            Tauri IPC Bridge (JSON serialization)
                       │
┌──────────────────────┴───────────────────────────┐
│                Backend (Rust)                     │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │              Tauri Commands                  │  │
│  │  (IPC handlers — accounts, auth, quota,      │  │
│  │   platform, settings)                        │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                             │
│  ┌─────────────┐  ┌┴────────────┐  ┌──────────┐  │
│  │  Services   │  │   Models    │  │  Utils   │  │
│  │             │  │             │  │          │  │
│  │ • database  │  │ • Account   │  │ • paths  │  │
│  │ • crypto    │  │ • Quota     │  │ • process│  │
│  │ • http      │  │ • Settings  │  │          │  │
│  │ • oauth     │  │             │  │          │  │
│  │ • platform  │  │             │  │          │  │
│  └──────┬──────┘  └─────────────┘  └──────────┘  │
│         │                                         │
│  ┌──────┴──────────────────────────────────────┐  │
│  │           Storage Layer                      │  │
│  │                                              │  │
│  │  SQLite Database    OS Keychain              │  │
│  │  (accounts, quota   (encryption keys,        │  │
│  │   history, config)   master password)        │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## Data Flow

### Quota Monitoring Flow

1. Frontend schedules periodic quota refresh via `useInterval` hook
2. Hook calls Zustand action → Tauri IPC `invoke("fetch_quota", ...)`
3. Rust command handler calls `http_client` service to query Antigravity API
4. Response is parsed into `QuotaSnapshot` model
5. Snapshot is stored in SQLite for history tracking
6. Data is returned to frontend via IPC response
7. Zustand store updates → React re-renders quota cards

### Account Switch Flow

1. User clicks "Activate" on an account card
2. Frontend calls `invoke("switch_account", { accountId, restart })`
3. Rust checks if Antigravity process is running (`process::detect`)
4. If running: emits event to UI asking for confirmation
5. Rust backs up current auth files from Antigravity config directory
6. Writes new account's decrypted tokens to the config directory
7. Optionally restarts Antigravity process
8. Updates `is_active` flag in SQLite
9. Returns success → UI updates active account indicator

## Key Design Decisions

See the [Architecture Decision Records](adr/) for detailed reasoning behind major choices:

- [ADR-001: Tauri v2 over Electron](adr/001-tauri-over-electron.md)
- [ADR-002: React 19 as Frontend Framework](adr/002-react-over-svelte.md)
