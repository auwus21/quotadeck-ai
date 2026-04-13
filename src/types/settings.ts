/**
 * Type definitions for application settings.
 */

/** Supported theme values */
export type ThemeMode = "dark" | "light" | "system";

/** Supported language codes */
export type LanguageCode = "en" | "es" | "pt";

/** Application settings stored locally */
export interface AppSettings {
  /** UI theme preference */
  theme: ThemeMode;

  /** Display language */
  language: LanguageCode;

  /** Quota polling interval in milliseconds */
  quotaPollInterval: number;

  /** Quota percentage threshold for low-quota alerts */
  lowQuotaThreshold: number;

  /** Whether to start app on system boot */
  launchAtStartup: boolean;

  /** Whether to minimize to system tray on close */
  minimizeToTray: boolean;

  /** Custom path to Antigravity installation (null = auto-detect) */
  antigravityPath: string | null;

  /** Whether to restart Antigravity after switching accounts */
  restartAfterSwitch: boolean;
}

/** Default settings applied on first launch */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "en",
  quotaPollInterval: 5 * 60 * 1000,
  lowQuotaThreshold: 20,
  launchAtStartup: false,
  minimizeToTray: true,
  antigravityPath: null,
  restartAfterSwitch: true,
};
