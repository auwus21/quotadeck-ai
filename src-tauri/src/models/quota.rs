//! Quota data models.
//!
//! Structures representing AI model quota information
//! fetched from Antigravity's API.

use serde::{Deserialize, Serialize};

/// Quota information for a single AI model.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelQuota {
    /// Model identifier (e.g., "gemini-2.5-pro")
    pub model: String,

    /// Human-readable model name
    pub display_name: String,

    /// Number of requests/tokens used in current period
    pub used: u64,

    /// Total quota limit for current period
    pub total: u64,

    /// ISO 8601 timestamp when this quota resets
    pub resets_at: Option<String>,

    /// ISO 8601 timestamp when this data was last fetched
    pub fetched_at: String,
}

/// Complete quota status for an account.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaStatus {
    /// Account ID this quota belongs to
    pub account_id: String,

    /// Individual model quotas
    pub models: Vec<ModelQuota>,

    /// ISO 8601 timestamp of the last successful fetch
    pub last_updated: String,

    /// Whether the quota fetch was successful
    pub success: bool,

    /// Error message if the fetch failed
    pub error: Option<String>,
}
