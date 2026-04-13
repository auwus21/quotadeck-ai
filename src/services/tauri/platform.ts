import { invoke } from "@tauri-apps/api/core";

/** Antigravity installation status returned from the backend. */
export interface AntigravityInfo {
  isInstalled: boolean;
  configPath: string | null;
  isRunning: boolean;
  version: string | null;
}

/**
 * Tauri IPC wrapper for platform detection commands.
 */

/** Detects whether Antigravity is installed and running. */
export async function detectAntigravity(): Promise<AntigravityInfo> {
  return invoke<AntigravityInfo>("detect_antigravity");
}

/** Checks if Antigravity is currently running. */
export async function getAntigravityStatus(): Promise<boolean> {
  return invoke<boolean>("get_antigravity_status");
}
