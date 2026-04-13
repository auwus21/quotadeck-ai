//! Application settings IPC commands.

use tauri::State;

use crate::error::AppError;
use crate::models::settings::AppSettings;
use crate::services::database::Database;

/// Returns the current application settings.
///
/// Called from frontend: `invoke("get_settings")`
#[tauri::command]
pub fn get_settings(db: State<'_, Database>) -> Result<AppSettings, AppError> {
    db.get_all_settings()
}

/// Updates application settings.
///
/// Called from frontend: `invoke("update_settings", { settings })`
#[tauri::command]
pub fn update_settings(
    settings: AppSettings,
    db: State<'_, Database>,
) -> Result<AppSettings, AppError> {
    db.save_all_settings(&settings)?;
    db.get_all_settings()
}

/// Returns the recent activity log entries.
///
/// Called from frontend: `invoke("get_activity_log", { limit })`
#[tauri::command]
pub fn get_activity_log(
    limit: Option<u32>,
    db: State<'_, Database>,
) -> Result<Vec<serde_json::Value>, AppError> {
    db.get_recent_activity(limit.unwrap_or(20))
}
