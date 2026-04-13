//! Google OAuth 2.0 service for Antigravity account authentication.
//!
//! Handles OAuth URL generation, authorization code exchange,
//! access token refresh, and user info retrieval using the
//! same Google OAuth client that Antigravity IDE uses.

use serde::Deserialize;
use std::sync::LazyLock;

use crate::error::AppError;

// ── OAuth Constants ──
// Credentials are loaded from environment variables (.env file).
// See src-tauri/.env.example for the required variables.

static CLIENT_ID: LazyLock<String> = LazyLock::new(|| {
    std::env::var("GOOGLE_CLIENT_ID")
        .expect("GOOGLE_CLIENT_ID not set. Copy .env.example to .env and fill in credentials.")
});

static CLIENT_SECRET: LazyLock<String> = LazyLock::new(|| {
    std::env::var("GOOGLE_CLIENT_SECRET")
        .expect("GOOGLE_CLIENT_SECRET not set. Copy .env.example to .env and fill in credentials.")
});

const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v2/userinfo";
const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";

/// OAuth scopes required for Antigravity compatibility.
const SCOPES: &[&str] = &[
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/cclog",
    "https://www.googleapis.com/auth/experimentsandconfigs",
];

/// Response from Google's token endpoint.
#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub expires_in: i64,
    #[serde(default)]
    pub token_type: String,
    #[serde(default)]
    pub refresh_token: Option<String>,
}

/// User profile information from Google.
#[derive(Debug, Deserialize)]
pub struct UserInfo {
    #[serde(default)]
    pub id: Option<String>,
    pub email: String,
    pub name: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub picture: Option<String>,
}

impl UserInfo {
    /// Returns the best available display name.
    pub fn display_name(&self) -> String {
        if let Some(name) = &self.name {
            if !name.trim().is_empty() {
                return name.clone();
            }
        }
        match (&self.given_name, &self.family_name) {
            (Some(given), Some(family)) => format!("{} {}", given, family),
            (Some(given), None) => given.clone(),
            (None, Some(family)) => family.clone(),
            (None, None) => self.email.clone(),
        }
    }
}

/// Generates the Google OAuth authorization URL.
pub fn build_auth_url(redirect_uri: &str) -> String {
    let scopes = SCOPES.join(" ");

    let params = [
        ("client_id", CLIENT_ID.as_str()),
        ("redirect_uri", redirect_uri),
        ("response_type", "code"),
        ("scope", &scopes),
        ("access_type", "offline"),
        ("prompt", "consent"),
    ];

    let url = url::Url::parse_with_params(AUTH_URL, &params)
        .expect("Invalid OAuth URL");
    url.to_string()
}

/// Exchanges an authorization code for access and refresh tokens.
pub async fn exchange_code(
    code: &str,
    redirect_uri: &str,
) -> Result<TokenResponse, AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::HttpRequest(format!("HTTP client error: {}", e)))?;

    let params = [
        ("client_id", CLIENT_ID.as_str()),
        ("client_secret", CLIENT_SECRET.as_str()),
        ("code", code),
        ("redirect_uri", redirect_uri),
        ("grant_type", "authorization_code"),
    ];

    let response = client
        .post(TOKEN_URL)
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::HttpRequest(format!("Token exchange failed: {}", e)))?;

    if response.status().is_success() {
        let token: TokenResponse = response
            .json()
            .await
            .map_err(|e| AppError::HttpRequest(format!("Token parse error: {}", e)))?;
        Ok(token)
    } else {
        let error_text: String = response.text().await.unwrap_or_default();
        Err(AppError::HttpRequest(format!(
            "Token exchange failed: {}",
            error_text
        )))
    }
}

/// Refreshes an access token using a refresh token.
pub async fn refresh_access_token(
    refresh_token: &str,
) -> Result<TokenResponse, AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::HttpRequest(format!("HTTP client error: {}", e)))?;

    let params = [
        ("client_id", CLIENT_ID.as_str()),
        ("client_secret", CLIENT_SECRET.as_str()),
        ("refresh_token", refresh_token),
        ("grant_type", "refresh_token"),
    ];

    let response = client
        .post(TOKEN_URL)
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::HttpRequest(format!("Refresh failed: {}", e)))?;

    if response.status().is_success() {
        let token: TokenResponse = response
            .json()
            .await
            .map_err(|e| AppError::HttpRequest(format!("Refresh parse error: {}", e)))?;
        Ok(token)
    } else {
        let error_text: String = response.text().await.unwrap_or_default();
        Err(AppError::HttpRequest(format!("Refresh failed: {}", error_text)))
    }
}

/// Fetches user profile information using an access token.
pub async fn get_user_info(access_token: &str) -> Result<UserInfo, AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::HttpRequest(format!("HTTP client error: {}", e)))?;

    let response = client
        .get(USERINFO_URL)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| AppError::HttpRequest(format!("User info request failed: {}", e)))?;

    if response.status().is_success() {
        let info: UserInfo = response
            .json()
            .await
            .map_err(|e| AppError::HttpRequest(format!("User info parse error: {}", e)))?;
        Ok(info)
    } else {
        let error_text: String = response.text().await.unwrap_or_default();
        Err(AppError::HttpRequest(format!(
            "User info fetch failed: {}",
            error_text
        )))
    }
}
