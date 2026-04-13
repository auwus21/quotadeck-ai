//! Account management IPC commands.
//!
//! Exposes account CRUD operations and switching functionality
//! to the frontend via Tauri's `invoke()` API.

use tauri::State;

use crate::error::AppError;
use crate::models::account::{Account, AddAccountPayload, UpdateAccountPayload};
use crate::services::crypto;
use crate::services::database::Database;

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

/// Switches the active account.
///
/// This deactivates the current account and activates the target.
/// In a full implementation, this would also swap auth files in
/// the Antigravity config directory.
///
/// Called from frontend: `invoke("switch_account", { id })`
#[tauri::command]
pub fn switch_account(id: String, db: State<'_, Database>) -> Result<Account, AppError> {
    // Verify the account exists
    let _account = db.get_account(&id)?;

    // TODO: Phase 3 — actual auth file swapping
    // 1. Check if Antigravity is running
    // 2. Back up current auth files
    // 3. Decrypt target account's token
    // 4. Write token to Antigravity's config
    // 5. Optionally restart Antigravity

    // For now, just update the active flag in the database
    db.set_active_account(&id)
}
