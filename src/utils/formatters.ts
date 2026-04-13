import { formatDistanceToNow, format, differenceInMinutes, differenceInHours, type Locale } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";

/**
 * Locale map for date-fns formatting based on app language.
 */
const localeMap: Record<string, Locale> = {
  en: enUS,
  es: es,
  pt: ptBR,
};

/**
 * Formats a quota percentage for display with color semantics.
 *
 * @param used - Number of requests/tokens used
 * @param total - Total quota limit
 * @returns Object with formatted string and percentage value
 *
 * @example
 * ```ts
 * formatQuota(75, 100) // { text: "75 / 100", percent: 75, remaining: 25 }
 * ```
 */
export function formatQuota(used: number, total: number) {
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const remaining = Math.max(0, total - used);

  return {
    text: `${used.toLocaleString()} / ${total.toLocaleString()}`,
    percent,
    remaining,
    remainingText: remaining.toLocaleString(),
  };
}

/**
 * Formats a countdown string for quota reset time.
 *
 * @param resetAt - ISO 8601 timestamp when quota resets
 * @param lang - Current language code for localization
 * @returns Human-readable countdown string
 *
 * @example
 * ```ts
 * formatCountdown("2026-04-14T00:00:00Z", "es")
 * // → "en 6 horas"
 * ```
 */
export function formatCountdown(resetAt: string | null, lang: string = "en"): string {
  if (!resetAt) return "—";

  const resetDate = new Date(resetAt);
  const now = new Date();

  if (resetDate <= now) return lang === "es" ? "Reiniciando..." : "Resetting...";

  const locale = localeMap[lang] || enUS;
  return formatDistanceToNow(resetDate, { addSuffix: true, locale });
}

/**
 * Formats a date for display in the activity log.
 *
 * @param dateStr - ISO 8601 date string
 * @param lang - Current language code
 * @returns Formatted date string
 */
export function formatActivityDate(dateStr: string, lang: string = "en"): string {
  const date = new Date(dateStr);
  const locale = localeMap[lang] || enUS;

  const minutesAgo = differenceInMinutes(new Date(), date);
  if (minutesAgo < 1) return lang === "es" ? "Justo ahora" : "Just now";
  if (minutesAgo < 60) return formatDistanceToNow(date, { addSuffix: true, locale });

  const hoursAgo = differenceInHours(new Date(), date);
  if (hoursAgo < 24) return formatDistanceToNow(date, { addSuffix: true, locale });

  return format(date, "MMM d, HH:mm", { locale });
}

/**
 * Returns the appropriate CSS color variable name based on quota percentage.
 *
 * @param percent - Current usage percentage (0-100)
 * @returns CSS variable name for the status color
 */
export function getQuotaColor(percent: number): string {
  const remaining = 100 - percent;
  if (remaining <= 10) return "var(--accent-danger)";
  if (remaining <= 30) return "var(--accent-warning)";
  return "var(--accent-success)";
}

/**
 * Returns a Tailwind color class based on account status.
 *
 * @param status - Account status string
 * @returns Tailwind CSS class for the status badge
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-emerald-400 bg-emerald-400/10";
    case "rate_limited":
      return "text-amber-400 bg-amber-400/10";
    case "expired":
      return "text-red-400 bg-red-400/10";
    case "error":
      return "text-red-400 bg-red-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}
