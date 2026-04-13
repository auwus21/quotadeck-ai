//! Antigravity platform integration service.
//!
//! Handles detection, configuration reading/writing, and process
//! management for the Antigravity AI IDE.

use std::path::PathBuf;
use sysinfo::System;

use crate::error::AppError;
use crate::services::paths;

/// Information about the local Antigravity installation.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AntigravityInfo {
    /// Whether Antigravity is installed (config dir exists)
    pub is_installed: bool,

    /// Path to the configuration directory
    pub config_path: Option<String>,

    /// Whether Antigravity is currently running
    pub is_running: bool,

    /// Detected version (if available)
    pub version: Option<String>,
}

/// Detects the local Antigravity installation status.
///
/// Checks for the existence of the configuration directory and
/// scans running processes to determine if the IDE is active.
pub fn detect_installation() -> AntigravityInfo {
    let config_dir = paths::antigravity_config_dir();
    let is_installed = config_dir
        .as_ref()
        .map(|p| p.exists())
        .unwrap_or(false);

    let is_running = is_antigravity_running();

    AntigravityInfo {
        is_installed,
        config_path: config_dir.map(|p| p.to_string_lossy().to_string()),
        is_running,
        version: None, // Version detection can be added later
    }
}

/// Checks if any Antigravity process is currently running.
///
/// Scans the system's process list for executables matching
/// the Antigravity binary name.
pub fn is_antigravity_running() -> bool {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    // Antigravity may appear as different process names depending on the platform
    let target_names = [
        "antigravity",
        "Antigravity",
        "antigravity.exe",
        "Antigravity.exe",
        "antigravity-helper",
    ];

    sys.processes().values().any(|process| {
        let name = process.name().to_string_lossy();
        target_names.iter().any(|target| name.contains(target))
    })
}

/// Returns the list of auth-related files in the Antigravity config directory.
///
/// These are the files that need to be backed up and swapped
/// when switching accounts.
pub fn get_auth_files() -> Result<Vec<PathBuf>, AppError> {
    let config_dir = paths::antigravity_config_dir()
        .ok_or(AppError::AntigravityNotInstalled)?;

    if !config_dir.exists() {
        return Err(AppError::AntigravityNotInstalled);
    }

    let mut auth_files = Vec::new();

    // Common auth file locations in VS Code forks
    let potential_paths = vec![
        config_dir.join("User").join("globalStorage"),
        config_dir.join("auth-tokens"),
        config_dir.join("User").join("state.vscdb"),
        config_dir.join("User").join("state.vscdb.backup"),
    ];

    for path in potential_paths {
        if path.exists() {
            auth_files.push(path);
        }
    }

    Ok(auth_files)
}

/// Backs up the current auth files before switching accounts.
///
/// Creates a timestamped backup directory containing copies of
/// all auth-related files, so they can be restored if needed.
///
/// # Arguments
///
/// * `account_id` - The ID of the account being switched FROM
///
/// # Returns
///
/// Path to the backup directory
pub fn backup_auth_files(account_id: &str) -> Result<PathBuf, AppError> {
    let backup_base = paths::auth_backup_dir()
        .ok_or(AppError::Platform("Cannot determine backup directory".into()))?;

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_dir = backup_base.join(format!("{}_{}", account_id, timestamp));
    std::fs::create_dir_all(&backup_dir)?;

    let auth_files = get_auth_files()?;
    for src in &auth_files {
        if src.is_file() {
            let filename = src.file_name().unwrap_or_default();
            let dest = backup_dir.join(filename);
            std::fs::copy(src, &dest)?;
            tracing::info!("Backed up: {:?} -> {:?}", src, dest);
        } else if src.is_dir() {
            // For directories (like globalStorage), copy recursively
            let dirname = src.file_name().unwrap_or_default();
            let dest_dir = backup_dir.join(dirname);
            copy_dir_recursive(src, &dest_dir)?;
            tracing::info!("Backed up dir: {:?} -> {:?}", src, dest_dir);
        }
    }

    Ok(backup_dir)
}

/// Recursively copies a directory and its contents.
fn copy_dir_recursive(src: &PathBuf, dest: &PathBuf) -> Result<(), AppError> {
    std::fs::create_dir_all(dest)?;

    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dest_path = dest.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dest_path)?;
        } else {
            std::fs::copy(&src_path, &dest_path)?;
        }
    }

    Ok(())
}
