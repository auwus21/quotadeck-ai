//! Account data model.
//!
//! Represents a single Antigravity account stored in the local
//! database, with all metadata needed for display and switching.

use serde::{Deserialize, Serialize};

/// Possible lifecycle states for an account.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AccountStatus {
    /// Account is healthy and ready to use
    Active,
    /// Account has hit its quota limit
    RateLimited,
    /// Refresh token has expired — needs re-authentication
    Expired,
    /// An unexpected error occurred during the last operation
    Error,
}

impl AccountStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::RateLimited => "rate_limited",
            Self::Expired => "expired",
            Self::Error => "error",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "active" => Self::Active,
            "rate_limited" => Self::RateLimited,
            "expired" => Self::Expired,
            "error" => Self::Error,
            _ => Self::Error,
        }
    }
}

/// A single Antigravity account stored locally.
///
/// Sensitive fields (like `refresh_token`) are encrypted at rest
/// using AES-256-GCM before being written to SQLite.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    /// Unique identifier (UUID v4)
    pub id: String,

    /// Email address associated with this account
    pub email: String,

    /// User-defined label for quick identification
    pub label: String,

    /// Subscription plan type (free, pro, enterprise, etc.)
    pub plan: String,

    /// Whether this account is currently active in Antigravity
    pub is_active: bool,

    /// Current lifecycle status
    pub status: AccountStatus,

    /// ISO 8601 timestamp of when this account was added
    pub created_at: String,

    /// ISO 8601 timestamp of last modification
    pub updated_at: String,

    /// ISO 8601 timestamp of when this account was last activated
    pub last_used: Option<String>,
}

/// Payload received from the frontend when adding a new account.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddAccountPayload {
    pub email: String,
    pub refresh_token: String,
    pub label: Option<String>,
}

/// Payload received from the frontend when updating an account.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAccountPayload {
    pub id: String,
    pub label: Option<String>,
}
