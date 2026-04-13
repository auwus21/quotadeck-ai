//! QuotaDeck AI — Application Entry Point
//!
//! Sets up the Tauri application with all plugins, services,
//! and IPC command handlers.

mod commands;
mod error;
mod models;
mod services;

use services::database::Database;
use services::paths;

/// Initializes and runs the QuotaDeck AI desktop application.
///
/// # Setup Process
///
/// 1. Resolves the database path for the current OS
/// 2. Initializes SQLite with schema migrations
/// 3. Registers all Tauri plugins (dialog, fs, notifications)
/// 4. Registers all IPC command handlers
/// 5. Starts the application event loop
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize the database
    let db_path = paths::database_path()
        .expect("Failed to resolve database path. Ensure your OS config directory is accessible.");

    let database = Database::new(&db_path)
        .expect("Failed to initialize database. Check file permissions.");

    tracing::info!("Database initialized at: {:?}", db_path);

    tauri::Builder::default()
        // ── Plugins ──
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        // ── Managed State ──
        .manage(database)
        // ── IPC Commands ──
        .invoke_handler(tauri::generate_handler![
            // Account commands
            commands::accounts::get_accounts,
            commands::accounts::add_account,
            commands::accounts::update_account,
            commands::accounts::remove_account,
            commands::accounts::switch_account,
            // Platform commands
            commands::platform::detect_antigravity,
            commands::platform::get_antigravity_status,
            // Settings commands
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_activity_log,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running QuotaDeck AI");
}
