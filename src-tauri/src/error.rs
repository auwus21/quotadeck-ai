//! Custom error types for QuotaDeck AI backend.
//!
//! All service-level errors are unified into `AppError` which
//! implements Tauri's serialization requirements for IPC responses.

use serde::Serialize;

/// Unified application error type.
///
/// This enum captures all possible error conditions across the
/// backend services. It implements `Serialize` so errors can be
/// sent back to the frontend via Tauri IPC.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Account not found: {0}")]
    AccountNotFound(String),

    #[error("Account already exists: {0}")]
    DuplicateAccount(String),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("HTTP request failed: {0}")]
    HttpRequest(String),

    #[error("Antigravity not installed")]
    AntigravityNotInstalled,

    #[error("Antigravity is currently running. Close it before switching accounts.")]
    AntigravityRunning,

    #[error("Platform error: {0}")]
    Platform(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Settings error: {0}")]
    Settings(String),
}

// Tauri requires errors to implement Serialize for IPC transport
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Conversion from common error types
impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::HttpRequest(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::InvalidInput(err.to_string())
    }
}
