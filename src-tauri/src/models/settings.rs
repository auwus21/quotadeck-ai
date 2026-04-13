//! Application settings model.

use serde::{Deserialize, Serialize};

/// Persisted application settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub quota_poll_interval: u64,
    pub low_quota_threshold: u32,
    pub launch_at_startup: bool,
    pub minimize_to_tray: bool,
    pub antigravity_path: Option<String>,
    pub restart_after_switch: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            language: "en".to_string(),
            quota_poll_interval: 300_000, // 5 minutes
            low_quota_threshold: 20,
            launch_at_startup: false,
            minimize_to_tray: true,
            antigravity_path: None,
            restart_after_switch: true,
        }
    }
}
