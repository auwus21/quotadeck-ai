import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Palette, Bell, Monitor, Info, Save } from "lucide-react";
import { cn } from "../../utils/cn";
import { APP_NAME, APP_VERSION, SUPPORTED_LANGUAGES } from "../../utils/constants";
import { getSettings, updateSettings } from "../../services/tauri/settings";
import { detectAntigravity, type AntigravityInfo } from "../../services/tauri/platform";
import type { AppSettings, ThemeMode, LanguageCode } from "../../types/settings";
import { DEFAULT_SETTINGS } from "../../types/settings";

/**
 * Settings page component.
 *
 * Provides controls for theme, language, quota polling,
 * alert thresholds, and Antigravity integration options.
 * All changes are persisted to SQLite via the Rust backend.
 */
export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [antigravityInfo, setAntigravityInfo] = useState<AntigravityInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from backend
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));

    // Detect Antigravity installation
    detectAntigravity()
      .then(setAntigravityInfo)
      .catch(() => null);
  }, []);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* ── General ── */}
      <SettingsSection icon={<Globe size={18} />} title="General">
        {/* Language */}
        <SettingsRow label="Language" description="Display language for the application">
          <select
            value={settings.language}
            onChange={(e) => handleChange("language", e.target.value as LanguageCode)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm",
              "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
              "text-[var(--text-primary)]",
              "focus:outline-none focus:border-[var(--accent-primary)]"
            )}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </SettingsRow>

        {/* Theme */}
        <SettingsRow label="Theme" description="Application color scheme">
          <div className="flex gap-2">
            {(["dark", "light", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleChange("theme", mode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium capitalize",
                  "border transition-all duration-150",
                  settings.theme === mode
                    ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* ── Quota Monitoring ── */}
      <SettingsSection icon={<Bell size={18} />} title="Quota Monitoring">
        <SettingsRow label="Refresh Interval" description="How often to check quota usage">
          <select
            value={settings.quotaPollInterval}
            onChange={(e) => handleChange("quotaPollInterval", Number(e.target.value))}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm",
              "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
              "text-[var(--text-primary)]",
              "focus:outline-none focus:border-[var(--accent-primary)]"
            )}
          >
            <option value={60000}>1 minute</option>
            <option value={300000}>5 minutes</option>
            <option value={600000}>10 minutes</option>
            <option value={1800000}>30 minutes</option>
          </select>
        </SettingsRow>

        <SettingsRow label="Low Quota Alert" description="Show alert when remaining quota falls below this percentage">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={settings.lowQuotaThreshold}
              onChange={(e) => handleChange("lowQuotaThreshold", Number(e.target.value))}
              className="w-32 accent-[var(--accent-primary)]"
            />
            <span className="text-sm text-[var(--text-primary)] font-medium w-10">
              {settings.lowQuotaThreshold}%
            </span>
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* ── Antigravity ── */}
      <SettingsSection icon={<Monitor size={18} />} title="Antigravity Integration">
        <SettingsRow
          label="Installation Status"
          description="Detected Antigravity installation"
        >
          <span
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
              antigravityInfo?.isInstalled
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-red-400 bg-red-400/10"
            )}
          >
            {antigravityInfo?.isInstalled ? "✓ Installed" : "✗ Not detected"}
          </span>
        </SettingsRow>

        {antigravityInfo?.configPath && (
          <SettingsRow label="Config Path" description="Location of Antigravity configuration">
            <span className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[300px]">
              {antigravityInfo.configPath}
            </span>
          </SettingsRow>
        )}

        <SettingsRow
          label="Restart After Switch"
          description="Automatically restart Antigravity when switching accounts"
        >
          <ToggleSwitch
            checked={settings.restartAfterSwitch}
            onChange={(v) => handleChange("restartAfterSwitch", v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ── Behavior ── */}
      <SettingsSection icon={<Palette size={18} />} title="Behavior">
        <SettingsRow
          label="Minimize to Tray"
          description="Keep running in the system tray when window is closed"
        >
          <ToggleSwitch
            checked={settings.minimizeToTray}
            onChange={(v) => handleChange("minimizeToTray", v)}
          />
        </SettingsRow>

        <SettingsRow
          label="Launch at Startup"
          description="Start QuotaDeck AI when your computer boots"
        >
          <ToggleSwitch
            checked={settings.launchAtStartup}
            onChange={(v) => handleChange("launchAtStartup", v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ── About ── */}
      <SettingsSection icon={<Info size={18} />} title="About">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{APP_NAME}</p>
            <p className="text-xs text-[var(--text-muted)]">Version {APP_VERSION}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">MIT License · Open Source</p>
          </div>
        </div>
      </SettingsSection>

      {/* ── Save Button ── */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
            "transition-all duration-200",
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-lg shadow-[var(--accent-primary)]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Save size={14} />
          {isSaving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

/* ── Reusable Sub-components ── */

function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl p-5",
        "bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--accent-primary)]">{icon}</span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-10 h-5.5 rounded-full transition-colors duration-200",
        checked ? "bg-[var(--accent-primary)]" : "bg-[var(--border-default)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white",
          "transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-0"
        )}
      />
    </button>
  );
}
