//! Account management IPC commands.
//!
//! Exposes account CRUD operations and switching functionality
//! to the frontend via Tauri's `invoke()` API.

use tauri::State;

use crate::error::AppError;
use crate::models::account::{Account, AddAccountPayload, UpdateAccountPayload};
use crate::services::crypto;
use crate::services::database::Database;
use crate::services::antigravity;

/// Returns all accounts in the local database.
///
/// Called from frontend: `invoke("get_accounts")`
#[tauri::command]
pub fn get_accounts(db: State<'_, Database>) -> Result<Vec<Account>, AppError> {
    db.get_all_accounts()
}

/// Adds a new account with an encrypted refresh token.
///
/// Called from frontend: `invoke("add_account", { payload })`
#[tauri::command]
pub fn add_account(
    payload: AddAccountPayload,
    db: State<'_, Database>,
) -> Result<Account, AppError> {
    // Validate input
    if payload.email.trim().is_empty() {
        return Err(AppError::InvalidInput("Email is required".into()));
    }
    if payload.refresh_token.trim().is_empty() {
        return Err(AppError::InvalidInput("Refresh token is required".into()));
    }

    // Encrypt the token before storage
    let encrypted_token = crypto::encrypt(&payload.refresh_token)?;

    // Generate a unique ID
    let id = uuid::Uuid::new_v4().to_string();

    let label = payload.label.unwrap_or_default();

    db.create_account(&id, &payload.email, &label, &encrypted_token)
}

/// Updates an existing account's metadata.
///
/// Called from frontend: `invoke("update_account", { payload })`
#[tauri::command]
pub fn update_account(
    payload: UpdateAccountPayload,
    db: State<'_, Database>,
) -> Result<Account, AppError> {
    if let Some(ref label) = payload.label {
        db.update_account_label(&payload.id, label)
    } else {
        db.get_account(&payload.id)
    }
}

/// Removes an account from the database.
///
/// Called from frontend: `invoke("remove_account", { id })`
#[tauri::command]
pub fn remove_account(id: String, db: State<'_, Database>) -> Result<(), AppError> {
    db.delete_account(&id)
}

/// Switches the active account with real auth file swapping.
///
/// Process:
/// 1. Verify the target account exists
/// 2. Back up current Antigravity auth files
/// 3. Decrypt the target account's refresh token
/// 4. Write the token to Antigravity's config directory
/// 5. Update the active flag in the database
///
/// Called from frontend: `invoke("switch_account", { id })`
#[tauri::command]
pub fn switch_account(id: String, db: State<'_, Database>) -> Result<Account, AppError> {
    // 1. Verify the account exists and get its data
    let account = db.get_account(&id)?;

    // 2. Get the Antigravity config directory
    let config_dir = crate::services::paths::antigravity_config_dir()
        .ok_or(AppError::AntigravityNotInstalled)?;

    if config_dir.exists() {
        // 3. Backup current auth files before switching
        match antigravity::backup_auth_files(&id) {
            Ok(backup_path) => {
                tracing::info!("Auth files backed up to: {:?}", backup_path);
            }
            Err(e) => {
                tracing::warn!("Could not backup auth files (continuing anyway): {}", e);
            }
        }
    }

    // 4. Decrypt target account's refresh token
    let encrypted_token = db.get_encrypted_token(&id)?;
    let refresh_token = crypto::decrypt(&encrypted_token)?;

    // 5. Write the token to Antigravity's auth storage
    write_auth_to_antigravity(&config_dir, &refresh_token, &account.email)?;

    // 6. Update the active flag in the database
    db.set_active_account(&id)
}

/// Writes the refresh token to Antigravity's local auth storage.
///
/// Antigravity stores OAuth credentials in its User directory
/// using a JSON format. This function creates/updates those files
/// to inject the target account's credentials.
fn write_auth_to_antigravity(
    config_dir: &std::path::Path,
    refresh_token: &str,
    email: &str,
) -> Result<(), AppError> {
    let user_dir = config_dir.join("User");
    std::fs::create_dir_all(&user_dir)?;

    // Write to globalStorage auth location
    let global_storage = user_dir.join("globalStorage");
    std::fs::create_dir_all(&global_storage)?;

    // Create the auth token JSON that Antigravity expects
    let auth_json = serde_json::json!({
        "account": email,
        "refreshToken": refresh_token,
        "type": "google",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "QuotaDeck AI"
    });

    let auth_file = global_storage.join("quotadeck-auth.json");
    std::fs::write(
        &auth_file,
        serde_json::to_string_pretty(&auth_json)
            .map_err(|e| AppError::Io(format!("JSON serialize error: {}", e)))?,
    )?;

    tracing::info!("Auth token written for {} to {:?}", email, auth_file);
    Ok(())
}

/// Restarts the Antigravity IDE process.
///
/// Called from frontend: `invoke("restart_antigravity")`
#[tauri::command]
pub fn restart_antigravity() -> Result<(), AppError> {
    // Find and kill the running Antigravity process
    let mut sys = sysinfo::System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let target_names = [
        "antigravity",
        "Antigravity",
        "antigravity.exe",
        "Antigravity.exe",
    ];

    let mut killed = false;
    for (pid, process) in sys.processes() {
        let name = process.name().to_string_lossy();
        if target_names.iter().any(|t| name.contains(t)) {
            tracing::info!("Killing Antigravity process {} (PID: {})", name, pid);
            process.kill();
            killed = true;
        }
    }

    if killed {
        tracing::info!("Antigravity process terminated. User should relaunch manually.");
    } else {
        tracing::info!("No Antigravity process found to kill.");
    }

    Ok(())
}
