# Security Policy

## Supported Versions

| Version | Supported |
|---------|:---------:|
| Latest  | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in QuotaDeck AI, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainers directly or use GitHub's private vulnerability reporting feature.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix and disclosure**: Coordinated with reporter

## Security Considerations

QuotaDeck AI handles sensitive authentication tokens. Here is how we protect them:

- **Encryption**: All tokens are encrypted using AES-256-GCM before storage
- **OS Keychain**: Encryption keys are stored in the operating system's secure credential store (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- **Local-only**: No data is transmitted to external servers. All data stays on your machine
- **Process isolation**: The Tauri security model ensures frontend code cannot directly access the filesystem or system APIs without explicit backend permission

## Best Practices for Users

1. **Keep QuotaDeck AI updated** to receive security patches
2. **Do not share** your QuotaDeck AI data directory with others
3. **Use strong system passwords** as your OS keychain is only as secure as your user account
4. **Review tokens periodically** and remove accounts you no longer use
