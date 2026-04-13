//! OAuth IPC command handlers.
//!
//! These commands expose the OAuth authentication flow to the
//! frontend, supporting three modes of adding accounts:
//! 1. Full automatic OAuth (opens browser, waits for callback)
//! 2. Manual callback URL submission
//! 3. Direct token/JSON import

use crate::models::account::Account;
use crate::services::{crypto, database::Database, oauth, oauth_server};

/// Generates the OAuth authorization URL and prepares the local server.
///
/// Returns `{ authUrl, port }` — the frontend should open the URL
/// in the user's default browser.
#[tauri::command]
pub async fn prepare_oauth() -> Result<serde_json::Value, String> {
    let (auth_url, port) = oauth_server::prepare_oauth_url()
        .await
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "authUrl": auth_url,
        "port": port,
    }))
}

/// Starts the OAuth callback listener and waits for the user to
/// authorize in the browser. Call this AFTER `prepare_oauth`.
///
/// This blocks until the callback is received, cancelled, or times out.
#[tauri::command]
pub async fn wait_for_oauth_callback(
    port: u16,
    db: tauri::State<'_, Database>,
) -> Result<Account, String> {
    // Wait for the callback
    let callback = oauth_server::wait_for_callback(port)
        .await
        .map_err(|e| e.to_string())?;

    // Exchange the code for tokens
    let token_response = oauth::exchange_code(&callback.code, &callback.redirect_uri)
        .await
        .map_err(|e| e.to_string())?;

    let refresh_token = token_response.refresh_token.ok_or_else(|| {
        "No refresh token received. You may need to revoke access at \
         https://myaccount.google.com/permissions and try again."
            .to_string()
    })?;

    // Get user info
    let user_info = oauth::get_user_info(&token_response.access_token)
        .await
        .map_err(|e| e.to_string())?;

    // Encrypt and save the account
    let encrypted_token = crypto::encrypt(&refresh_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    let account = db
        .upsert_account(&user_info.email, &user_info.display_name(), &encrypted_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    Ok(account)
}

/// Cancels any pending OAuth flow.
#[tauri::command]
pub async fn cancel_oauth() -> Result<(), String> {
    oauth_server::cancel();
    Ok(())
}

/// Completes an OAuth flow using a manually-pasted callback URL.
///
/// The user opens the OAuth URL themselves, authorizes, and then
/// pastes the full redirect URL (including the `?code=...` parameter).
#[tauri::command]
pub async fn submit_oauth_callback(
    callback_url: String,
    db: tauri::State<'_, Database>,
) -> Result<Account, String> {
    // Extract code from the pasted URL
    let code = oauth_server::extract_code_from_callback_url(&callback_url)
        .map_err(|e| e.to_string())?;

    // Extract the redirect_uri base from the callback URL
    let redirect_uri = {
        let parsed = url::Url::parse(&callback_url).ok();
        if let Some(p) = parsed {
            let port = p.port().map(|p| format!(":{}", p)).unwrap_or_default();
            format!("{}://{}{}", p.scheme(), p.host_str().unwrap_or("localhost"), port)
        } else {
            "http://localhost".to_string()
        }
    };

    let token_response = oauth::exchange_code(&code, &redirect_uri)
        .await
        .map_err(|e| e.to_string())?;

    let refresh_token = token_response.refresh_token.ok_or_else(|| {
        "No refresh token received. Revoke access at \
         https://myaccount.google.com/permissions and retry."
            .to_string()
    })?;

    let user_info = oauth::get_user_info(&token_response.access_token)
        .await
        .map_err(|e| e.to_string())?;

    let encrypted_token = crypto::encrypt(&refresh_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    let account = db
        .upsert_account(&user_info.email, &user_info.display_name(), &encrypted_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    Ok(account)
}

/// Imports an account using a raw refresh token (Token method).
///
/// The token is validated by fetching user info, then encrypted and stored.
#[tauri::command]
pub async fn import_with_token(
    refresh_token: String,
    label: Option<String>,
    db: tauri::State<'_, Database>,
) -> Result<Account, String> {
    // Refresh the token to get an access token and validate it
    let token_response = oauth::refresh_access_token(&refresh_token)
        .await
        .map_err(|e| format!("Invalid token: {}", e))?;

    // Get user info to determine the email
    let user_info = oauth::get_user_info(&token_response.access_token)
        .await
        .map_err(|e| format!("Failed to fetch user info: {}", e))?;

    let encrypted_token = crypto::encrypt(&refresh_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    let display_label = label.unwrap_or_else(|| user_info.display_name());

    let account = db
        .upsert_account(&user_info.email, &display_label, &encrypted_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    Ok(account)
}

/// Imports an account from the local Antigravity installation.
///
/// Reads the auth storage files from %APPDATA%/Antigravity to
/// extract the refresh token of the currently logged-in user.
#[tauri::command]
pub async fn import_from_antigravity(
    db: tauri::State<'_, Database>,
) -> Result<Account, String> {
    // Find the Antigravity auth directory
    let auth_dir = crate::services::paths::antigravity_auth_dir()
        .ok_or("Antigravity auth directory not found. Is Antigravity installed?")?;

    if !auth_dir.exists() {
        return Err("Antigravity auth directory does not exist. \
                    Please log in to Antigravity first."
            .into());
    }

    // Look for auth token files
    let mut refresh_token: Option<String> = None;

    for entry in std::fs::read_dir(&auth_dir).map_err(|e| format!("Cannot read auth dir: {}", e))? {
        let entry = entry.map_err(|e| format!("Dir entry error: {}", e))?;
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(token) = extract_refresh_token(&json) {
                    refresh_token = Some(token);
                    break;
                }
            }
        }
    }

    let refresh_token = refresh_token
        .ok_or("No refresh token found in Antigravity's auth files. \
                Make sure you are logged in to Antigravity.")?;

    // Validate the token and get user info
    let token_response = oauth::refresh_access_token(&refresh_token)
        .await
        .map_err(|e| format!("Token validation failed: {}", e))?;

    let user_info = oauth::get_user_info(&token_response.access_token)
        .await
        .map_err(|e| format!("Failed to fetch user info: {}", e))?;

    let encrypted_token = crypto::encrypt(&refresh_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    let account = db
        .upsert_account(&user_info.email, &user_info.display_name(), &encrypted_token)
        .map_err(|e: crate::error::AppError| e.to_string())?;

    Ok(account)
}

/// Recursively searches a JSON value for a refresh_token field.
fn extract_refresh_token(value: &serde_json::Value) -> Option<String> {
    match value {
        serde_json::Value::Object(map) => {
            if let Some(serde_json::Value::String(token)) = map.get("refresh_token") {
                if !token.is_empty() {
                    return Some(token.clone());
                }
            }
            if let Some(serde_json::Value::String(token)) = map.get("refreshToken") {
                if !token.is_empty() {
                    return Some(token.clone());
                }
            }
            for (_, v) in map {
                if let Some(token) = extract_refresh_token(v) {
                    return Some(token);
                }
            }
            None
        }
        serde_json::Value::Array(arr) => {
            for v in arr {
                if let Some(token) = extract_refresh_token(v) {
                    return Some(token);
                }
            }
            None
        }
        _ => None,
    }
}
