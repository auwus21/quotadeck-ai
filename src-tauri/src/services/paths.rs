//! Cross-platform path resolution for Antigravity and app data.
//!
//! Resolves OS-specific paths for:
//! - QuotaDeck AI's own data directory
//! - Antigravity IDE's configuration and auth directories

use std::path::PathBuf;

/// Returns the QuotaDeck AI data directory.
///
/// - Windows: `%APPDATA%\QuotaDeckAI`
/// - macOS:   `~/Library/Application Support/QuotaDeckAI`
/// - Linux:   `~/.config/QuotaDeckAI`
pub fn app_data_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("QuotaDeckAI"))
}

/// Returns the path to the QuotaDeck AI SQLite database.
pub fn database_path() -> Option<PathBuf> {
    app_data_dir().map(|d| d.join("quotadeck.db"))
}

/// Returns the Antigravity IDE configuration directory.
///
/// Antigravity is a VS Code fork and stores its data in
/// OS-specific standard configuration locations:
///
/// - Windows: `%APPDATA%\Antigravity`
/// - macOS:   `~/Library/Application Support/Antigravity`
/// - Linux:   `~/.config/Antigravity`
pub fn antigravity_config_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("APPDATA")
            .ok()
            .map(|appdata| PathBuf::from(appdata).join("Antigravity"))
    }

    #[cfg(target_os = "macos")]
    {
        dirs::home_dir().map(|h| h.join("Library/Application Support/Antigravity"))
    }

    #[cfg(target_os = "linux")]
    {
        dirs::config_dir().map(|c| c.join("Antigravity"))
    }
}

/// Returns the Antigravity user data directory.
///
/// This is where auth tokens, session data, and user
/// preferences are typically stored.
pub fn antigravity_user_dir() -> Option<PathBuf> {
    antigravity_config_dir().map(|d| d.join("User"))
}

/// Returns the path to Antigravity's auth/session storage.
///
/// The exact file varies by version, but commonly found at:
/// `{config_dir}/User/globalStorage/` or `{config_dir}/auth-tokens`
pub fn antigravity_auth_dir() -> Option<PathBuf> {
    antigravity_config_dir().map(|d| d.join("User").join("globalStorage"))
}

/// Returns the backup directory for auth files before switching accounts.
pub fn auth_backup_dir() -> Option<PathBuf> {
    app_data_dir().map(|d| d.join("backups"))
}
