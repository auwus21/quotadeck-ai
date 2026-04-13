# Coding Standards

This document defines the coding conventions and best practices for the QuotaDeck AI codebase.

## General Principles

1. **Readability over cleverness** — Write code that is easy to understand
2. **Type safety** — Use TypeScript strict mode and Rust's type system fully
3. **Document the "why"** — Comments should explain reasoning, not what the code does
4. **Small functions** — Each function should do one thing well
5. **Consistent naming** — Follow the naming conventions below

## TypeScript (Frontend)

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AccountCard.tsx` |
| Hooks | camelCase, `use` prefix | `useAccounts.ts` |
| Stores | camelCase, `Store` suffix | `accountStore.ts` |
| Utilities | camelCase | `formatters.ts` |
| Types | camelCase | `account.ts` |
| Constants | camelCase | `constants.ts` |

### Component Structure

```tsx
/**
 * Brief description of what this component does.
 *
 * @example
 * ```tsx
 * <AccountCard account={account} onActivate={handleActivate} />
 * ```
 */
interface AccountCardProps {
  /** The account data to display */
  account: Account;
  /** Callback when the user clicks the activate button */
  onActivate: (id: string) => void;
}

export function AccountCard({ account, onActivate }: AccountCardProps) {
  // hooks first
  const { t } = useTranslation();

  // derived state
  const isLowQuota = account.quotaPercent < 20;

  // handlers
  const handleClick = () => {
    onActivate(account.id);
  };

  // render
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

### Key Rules

- **Named exports** for all components (no default exports)
- **Props interfaces** defined above the component
- **JSDoc comments** on all exported functions and complex logic
- **Avoid `any`** — use `unknown` and type narrowing instead
- **Prefer `const`** over `let`

### Import Order

```typescript
// 1. React and third-party libraries
import { useState } from "react";
import { motion } from "framer-motion";

// 2. Internal components
import { Button } from "@/components/ui/Button";

// 3. Hooks and stores
import { useAccounts } from "@/hooks/useAccounts";

// 4. Types
import type { Account } from "@/types/account";

// 5. Utilities and constants
import { formatDate } from "@/utils/formatters";
```

## Rust (Backend)

### Module Organization

```rust
// Each module file starts with module-level documentation
//! Account management service.
//!
//! Handles CRUD operations for Antigravity accounts stored in the
//! local SQLite database.

use crate::models::account::Account;
use crate::services::database::Database;
```

### Documentation

```rust
/// Creates a new account entry in the local database.
///
/// The account's refresh token is encrypted using AES-256-GCM before
/// storage. The encryption key is derived from the OS keychain.
///
/// # Arguments
///
/// * `email` - The email address associated with this Antigravity account
/// * `refresh_token` - The OAuth refresh token (will be encrypted)
/// * `label` - Optional user-defined label for quick identification
///
/// # Errors
///
/// Returns `DatabaseError::DuplicateEmail` if an account with this
/// email already exists.
pub fn create_account(
    email: &str,
    refresh_token: &str,
    label: Option<&str>,
) -> Result<Account, DatabaseError> {
    // ...
}
```

### Key Rules

- **`clippy` clean** — No warnings allowed
- **`rustfmt` formatted** — Consistent formatting
- **Error types** — Use `thiserror` for custom error types
- **No `unwrap()` in production** — Use proper error handling with `?`
- **Serde derives** — All IPC types must derive `Serialize`/`Deserialize`

## CSS / Tailwind

### Class Organization

Follow this order for Tailwind classes:

1. Layout (`flex`, `grid`, `block`)
2. Positioning (`relative`, `absolute`)
3. Sizing (`w-`, `h-`, `p-`, `m-`)
4. Typography (`text-`, `font-`)
5. Visual (`bg-`, `border-`, `rounded-`, `shadow-`)
6. Interactive (`hover:`, `focus:`, `active:`)
7. Animation (`transition-`, `animate-`)

### CSS Variables

Custom design tokens are defined in `src/styles/globals.css` and should be used for all brand colors, spacing scales, and typography.

## Git Workflow

1. Branch from `main`
2. Use [Conventional Commits](../CONTRIBUTING.md#commit-convention)
3. Keep commits atomic — one logical change per commit
4. Squash-merge PRs to maintain a clean history
