//! Antigravity platform detection IPC commands.
//!
//! Provides information about the local Antigravity installation
//! status to the frontend.

use crate::error::AppError;
use crate::services::antigravity;

/// Detects whether Antigravity is installed and running.
///
/// Called from frontend: `invoke("detect_antigravity")`
#[tauri::command]
pub fn detect_antigravity() -> Result<antigravity::AntigravityInfo, AppError> {
    Ok(antigravity::detect_installation())
}

/// Checks if Antigravity is currently running.
///
/// Called from frontend: `invoke("get_antigravity_status")`
#[tauri::command]
pub fn get_antigravity_status() -> Result<bool, AppError> {
    Ok(antigravity::is_antigravity_running())
}
