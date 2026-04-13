import { invoke } from "@tauri-apps/api/core";
import type { AppSettings } from "../../types/settings";

/**
 * Tauri IPC wrapper for settings and activity log commands.
 */

/** Fetches the current application settings. */
export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

/** Updates application settings. */
export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  return invoke<AppSettings>("update_settings", { settings });
}

/** Fetches the recent activity log entries. */
export async function getActivityLog(limit?: number): Promise<unknown[]> {
  return invoke<unknown[]>("get_activity_log", { limit: limit ?? 20 });
}
