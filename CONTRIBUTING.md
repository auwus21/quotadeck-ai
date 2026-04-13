# Contributing to QuotaDeck AI

Thank you for your interest in contributing to QuotaDeck AI! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **Rust** (latest stable via [rustup](https://rustup.rs/))
- **Git** for version control

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/quotadeck-ai.git
cd quotadeck-ai

# 2. Install frontend dependencies
npm install

# 3. Start development mode
npm run tauri dev
```

For detailed setup instructions including platform-specific dependencies, see [Development Setup](docs/development/setup.md).

## Development Workflow

1. **Create a branch** from `main` for your work:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following our [Coding Standards](docs/development/coding-standards.md).

3. **Test your changes:**
   ```bash
   # Frontend type checking
   npm run typecheck

   # Rust tests
   cd src-tauri && cargo test

   # Rust linting
   cd src-tauri && cargo clippy -- -D warnings
   ```

4. **Commit using conventional commits** (see below).

5. **Push and open a Pull Request.**

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clean history and generate changelogs automatically.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, or dependency changes |
| `ci` | CI/CD configuration changes |

### Scopes

| Scope | Description |
|-------|-------------|
| `ui` | Frontend React components |
| `accounts` | Account management features |
| `quota` | Quota monitoring features |
| `auth` | Authentication and OAuth |
| `platform` | Antigravity platform integration |
| `db` | Database operations |
| `i18n` | Internationalization |
| `deps` | Dependency updates |

### Examples

```
feat(accounts): add OAuth 2.0 import flow
fix(quota): correct reset time calculation for Gemini Pro
docs(readme): update installation instructions
refactor(ui): extract QuotaBar into reusable component
chore(deps): bump @tauri-apps/api to v2.2.0
```

## Pull Request Process

1. **Fill out the PR template** completely.
2. **Ensure all CI checks pass** (linting, type checking, tests).
3. **Keep PRs focused** — one feature or fix per PR.
4. **Update documentation** if your changes affect user-facing behavior.
5. **Request review** from a maintainer.

## Reporting Issues

### Bug Reports

When filing a bug report, please include:

- **OS and version** (e.g., Windows 11, macOS 14.2)
- **QuotaDeck AI version** (check Settings > About)
- **Steps to reproduce** the issue
- **Expected vs. actual behavior**
- **Screenshots or logs** if applicable

### Feature Requests

We welcome feature suggestions! Please check existing issues first to avoid duplicates, then open a new issue using the feature request template.

---

Thank you for helping make QuotaDeck AI better! 🚀
