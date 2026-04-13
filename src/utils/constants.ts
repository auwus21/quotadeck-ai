/**
 * Application-wide constants.
 *
 * Centralizes magic numbers, default values, and configuration
 * constants to avoid scattered hardcoded values.
 */

/** Application metadata */
export const APP_NAME = "QuotaDeck AI";
export const APP_VERSION = "0.1.0";

/** Default polling interval for quota updates (in milliseconds) */
export const DEFAULT_QUOTA_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

/** Minimum polling interval allowed (in milliseconds) */
export const MIN_QUOTA_POLL_INTERVAL = 60 * 1000; // 1 minute

/** Quota percentage thresholds for visual indicators */
export const QUOTA_THRESHOLD = {
  /** Below this percentage, the quota bar shows as critical (red) */
  CRITICAL: 10,
  /** Below this percentage, the quota bar shows as warning (amber) */
  WARNING: 30,
  /** Above WARNING, the quota bar shows as healthy (green) */
  HEALTHY: 30,
} as const;

/** Supported languages */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇦🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
] as const;

/** Account status values */
export const ACCOUNT_STATUS = {
  ACTIVE: "active",
  RATE_LIMITED: "rate_limited",
  EXPIRED: "expired",
  ERROR: "error",
} as const;

/** Tauri IPC command names */
export const COMMANDS = {
  // Account commands
  GET_ACCOUNTS: "get_accounts",
  ADD_ACCOUNT: "add_account",
  REMOVE_ACCOUNT: "remove_account",
  UPDATE_ACCOUNT: "update_account",
  SWITCH_ACCOUNT: "switch_account",

  // Quota commands
  FETCH_QUOTA: "fetch_quota",
  GET_QUOTA_HISTORY: "get_quota_history",

  // Auth commands
  START_OAUTH: "start_oauth",
  IMPORT_TOKEN: "import_token",

  // Platform commands
  DETECT_ANTIGRAVITY: "detect_antigravity",
  GET_ANTIGRAVITY_STATUS: "get_antigravity_status",
  RESTART_ANTIGRAVITY: "restart_antigravity",

  // Settings commands
  GET_SETTINGS: "get_settings",
  UPDATE_SETTINGS: "update_settings",
} as const;

/** Tauri event names */
export const EVENTS = {
  QUOTA_UPDATED: "quota-updated",
  ACCOUNT_SWITCHED: "account-switched",
  OAUTH_CALLBACK: "oauth-callback",
  LOW_QUOTA_ALERT: "low-quota-alert",
} as const;
