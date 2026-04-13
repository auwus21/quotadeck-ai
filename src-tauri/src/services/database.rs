//! SQLite database service.
//!
//! Handles initialization, migrations, and all CRUD operations
//! for accounts, quota snapshots, settings, and activity logs.

use rusqlite::{Connection, params};
use std::path::Path;
use std::sync::Mutex;

use crate::error::AppError;
use crate::models::account::{Account, AccountStatus};
use crate::models::settings::AppSettings;

/// Thread-safe wrapper around the SQLite connection.
///
/// Tauri commands run on multiple threads, so we wrap the
/// connection in a Mutex for safe concurrent access.
pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// Opens or creates the SQLite database at the given path.
    ///
    /// Runs all pending migrations on first call to ensure the
    /// schema is up to date.
    pub fn new(db_path: &Path) -> Result<Self, AppError> {
        // Ensure the parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)
            .map_err(|e| AppError::Database(format!("Failed to open database: {}", e)))?;

        // Enable WAL mode for better concurrent read performance
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(|e| AppError::Database(format!("Failed to set pragmas: {}", e)))?;

        let db = Self {
            conn: Mutex::new(conn),
        };

        db.run_migrations()?;
        Ok(db)
    }

    /// Executes the database schema migration.
    fn run_migrations(&self) -> Result<(), AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS accounts (
                id          TEXT PRIMARY KEY,
                email       TEXT NOT NULL UNIQUE,
                label       TEXT NOT NULL DEFAULT '',
                plan        TEXT NOT NULL DEFAULT 'unknown',
                is_active   INTEGER NOT NULL DEFAULT 0,
                status      TEXT NOT NULL DEFAULT 'active',
                refresh_token_encrypted TEXT NOT NULL DEFAULT '',
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL,
                last_used   TEXT
            );

            CREATE TABLE IF NOT EXISTS quota_snapshots (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                model       TEXT NOT NULL,
                display_name TEXT NOT NULL DEFAULT '',
                used        INTEGER NOT NULL,
                total       INTEGER NOT NULL,
                resets_at   TEXT,
                fetched_at  TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activity_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                action      TEXT NOT NULL,
                details     TEXT,
                created_at  TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_quota_account
                ON quota_snapshots(account_id, fetched_at);

            CREATE INDEX IF NOT EXISTS idx_activity_date
                ON activity_log(created_at);
            "
        )?;

        Ok(())
    }

    // ────────────────────────────────────────────────────────
    // Account Operations
    // ────────────────────────────────────────────────────────

    /// Returns all accounts, ordered by creation date (newest first).
    pub fn get_all_accounts(&self) -> Result<Vec<Account>, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        let mut stmt = conn.prepare(
            "SELECT id, email, label, plan, is_active, status,
                    created_at, updated_at, last_used
             FROM accounts ORDER BY created_at DESC"
        )?;

        let accounts = stmt.query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                email: row.get(1)?,
                label: row.get(2)?,
                plan: row.get(3)?,
                is_active: row.get::<_, i32>(4)? != 0,
                status: AccountStatus::from_str(&row.get::<_, String>(5)?),
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                last_used: row.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(accounts)
    }

    /// Retrieves a single account by its ID.
    pub fn get_account(&self, id: &str) -> Result<Account, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        conn.query_row(
            "SELECT id, email, label, plan, is_active, status,
                    created_at, updated_at, last_used
             FROM accounts WHERE id = ?1",
            params![id],
            |row| {
                Ok(Account {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    label: row.get(2)?,
                    plan: row.get(3)?,
                    is_active: row.get::<_, i32>(4)? != 0,
                    status: AccountStatus::from_str(&row.get::<_, String>(5)?),
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    last_used: row.get(8)?,
                })
            },
        )
        .map_err(|_| AppError::AccountNotFound(id.to_string()))
    }

    /// Inserts a new account into the database.
    ///
    /// Returns the created account.
    pub fn create_account(
        &self,
        id: &str,
        email: &str,
        label: &str,
        encrypted_token: &str,
    ) -> Result<Account, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;
        let now = chrono::Utc::now().to_rfc3339();

        // Check for duplicate email
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM accounts WHERE email = ?1",
            params![email],
            |row| row.get(0),
        )?;

        if exists {
            return Err(AppError::DuplicateAccount(email.to_string()));
        }

        conn.execute(
            "INSERT INTO accounts (id, email, label, refresh_token_encrypted, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, email, label, encrypted_token, &now, &now],
        )?;

        // Log the action
        conn.execute(
            "INSERT INTO activity_log (action, details, created_at) VALUES (?1, ?2, ?3)",
            params![
                "account_added",
                format!(r#"{{"email":"{}","label":"{}"}}"#, email, label),
                &now,
            ],
        )?;

        drop(conn);
        self.get_account(id)
    }

    /// Creates a new account or updates the token if the email already exists.
    ///
    /// Used by the OAuth flow where a user may re-authenticate an
    /// existing account to refresh their credentials.
    pub fn upsert_account(
        &self,
        email: &str,
        label: &str,
        encrypted_token: &str,
    ) -> Result<Account, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;
        let now = chrono::Utc::now().to_rfc3339();

        // Check if account already exists
        let existing_id: Option<String> = conn.query_row(
            "SELECT id FROM accounts WHERE email = ?1",
            params![email],
            |row| row.get(0),
        ).ok();

        if let Some(id) = existing_id {
            // Update existing account with new token
            conn.execute(
                "UPDATE accounts SET refresh_token_encrypted = ?1, label = ?2, \
                 status = 'active', updated_at = ?3 WHERE id = ?4",
                params![encrypted_token, label, &now, &id],
            )?;

            conn.execute(
                "INSERT INTO activity_log (action, details, created_at) VALUES (?1, ?2, ?3)",
                params![
                    "account_refreshed",
                    format!(r#"{{"email":"{}"}}"#, email),
                    &now,
                ],
            )?;

            drop(conn);
            self.get_account(&id)
        } else {
            // Create new account
            let id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO accounts (id, email, label, refresh_token_encrypted, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![&id, email, label, encrypted_token, &now, &now],
            )?;

            conn.execute(
                "INSERT INTO activity_log (action, details, created_at) VALUES (?1, ?2, ?3)",
                params![
                    "account_added",
                    format!(r#"{{"email":"{}","label":"{}","method":"oauth"}}"#, email, label),
                    &now,
                ],
            )?;

            drop(conn);
            self.get_account(&id)
        }
    }

    /// Updates the label of an existing account.
    pub fn update_account_label(&self, id: &str, label: &str) -> Result<Account, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;
        let now = chrono::Utc::now().to_rfc3339();

        let affected = conn.execute(
            "UPDATE accounts SET label = ?1, updated_at = ?2 WHERE id = ?3",
            params![label, &now, id],
        )?;

        if affected == 0 {
            return Err(AppError::AccountNotFound(id.to_string()));
        }

        drop(conn);
        self.get_account(id)
    }

    /// Removes an account from the database.
    pub fn delete_account(&self, id: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;
        let now = chrono::Utc::now().to_rfc3339();

        // Get account info for logging before deletion
        let email: String = conn.query_row(
            "SELECT email FROM accounts WHERE id = ?1",
            params![id],
            |row| row.get(0),
        ).map_err(|_| AppError::AccountNotFound(id.to_string()))?;

        conn.execute("DELETE FROM accounts WHERE id = ?1", params![id])?;

        conn.execute(
            "INSERT INTO activity_log (action, details, created_at) VALUES (?1, ?2, ?3)",
            params!["account_removed", format!(r#"{{"email":"{}"}}"#, email), &now],
        )?;

        Ok(())
    }

    /// Sets a specific account as active and deactivates all others.
    ///
    /// Only one account can be active at a time.
    pub fn set_active_account(&self, id: &str) -> Result<Account, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;
        let now = chrono::Utc::now().to_rfc3339();

        // Deactivate all accounts
        conn.execute("UPDATE accounts SET is_active = 0", [])?;

        // Activate the target account
        let affected = conn.execute(
            "UPDATE accounts SET is_active = 1, last_used = ?1, updated_at = ?2 WHERE id = ?3",
            params![&now, &now, id],
        )?;

        if affected == 0 {
            return Err(AppError::AccountNotFound(id.to_string()));
        }

        // Log the switch
        conn.execute(
            "INSERT INTO activity_log (action, details, created_at) VALUES (?1, ?2, ?3)",
            params!["account_switched", format!(r#"{{"account_id":"{}"}}"#, id), &now],
        )?;

        drop(conn);
        self.get_account(id)
    }

    /// Retrieves the encrypted refresh token for an account.
    pub fn get_encrypted_token(&self, id: &str) -> Result<String, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        conn.query_row(
            "SELECT refresh_token_encrypted FROM accounts WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|_| AppError::AccountNotFound(id.to_string()))
    }

    // ────────────────────────────────────────────────────────
    // Settings Operations
    // ────────────────────────────────────────────────────────

    /// Gets a setting value by key.
    pub fn get_setting(&self, key: &str) -> Result<Option<String>, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        let result = conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        );

        match result {
            Ok(val) => Ok(Some(val)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AppError::Database(e.to_string())),
        }
    }

    /// Sets a setting value (insert or update).
    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = ?2",
            params![key, value],
        )?;

        Ok(())
    }

    /// Loads all settings into an AppSettings struct.
    pub fn get_all_settings(&self) -> Result<AppSettings, AppError> {
        let mut settings = AppSettings::default();

        if let Some(v) = self.get_setting("theme")? { settings.theme = v; }
        if let Some(v) = self.get_setting("language")? { settings.language = v; }
        if let Some(v) = self.get_setting("quota_poll_interval")? {
            settings.quota_poll_interval = v.parse().unwrap_or(300_000);
        }
        if let Some(v) = self.get_setting("low_quota_threshold")? {
            settings.low_quota_threshold = v.parse().unwrap_or(20);
        }
        if let Some(v) = self.get_setting("launch_at_startup")? {
            settings.launch_at_startup = v == "true";
        }
        if let Some(v) = self.get_setting("minimize_to_tray")? {
            settings.minimize_to_tray = v == "true";
        }
        if let Some(v) = self.get_setting("antigravity_path")? {
            settings.antigravity_path = Some(v);
        }
        if let Some(v) = self.get_setting("restart_after_switch")? {
            settings.restart_after_switch = v == "true";
        }

        Ok(settings)
    }

    /// Saves all settings from an AppSettings struct.
    pub fn save_all_settings(&self, settings: &AppSettings) -> Result<(), AppError> {
        self.set_setting("theme", &settings.theme)?;
        self.set_setting("language", &settings.language)?;
        self.set_setting("quota_poll_interval", &settings.quota_poll_interval.to_string())?;
        self.set_setting("low_quota_threshold", &settings.low_quota_threshold.to_string())?;
        self.set_setting("launch_at_startup", &settings.launch_at_startup.to_string())?;
        self.set_setting("minimize_to_tray", &settings.minimize_to_tray.to_string())?;
        if let Some(ref path) = settings.antigravity_path {
            self.set_setting("antigravity_path", path)?;
        }
        self.set_setting("restart_after_switch", &settings.restart_after_switch.to_string())?;
        Ok(())
    }

    // ────────────────────────────────────────────────────────
    // Activity Log
    // ────────────────────────────────────────────────────────

    /// Returns the most recent activity entries.
    pub fn get_recent_activity(&self, limit: u32) -> Result<Vec<serde_json::Value>, AppError> {
        let conn = self.conn.lock().map_err(|e| AppError::Database(e.to_string()))?;

        let mut stmt = conn.prepare(
            "SELECT action, details, created_at
             FROM activity_log ORDER BY created_at DESC LIMIT ?1"
        )?;

        let entries = stmt.query_map(params![limit], |row| {
            let action: String = row.get(0)?;
            let details: Option<String> = row.get(1)?;
            let created_at: String = row.get(2)?;

            Ok(serde_json::json!({
                "action": action,
                "details": details,
                "createdAt": created_at,
            }))
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(entries)
    }
}
