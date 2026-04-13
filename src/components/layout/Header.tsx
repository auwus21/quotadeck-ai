import { RefreshCw, Bell } from "lucide-react";
import { cn } from "../../utils/cn";

interface HeaderProps {
  /** Title of the current page */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Callback for the refresh action */
  onRefresh?: () => void;
  /** Whether a refresh operation is in progress */
  isRefreshing?: boolean;
}

/**
 * Top header bar displayed on every page.
 *
 * Shows the current page title and provides quick-access
 * actions like refresh and notifications.
 */
export function Header({ title, subtitle, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {/* ── Page Title ── */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
              "hover:bg-[var(--border-subtle)] transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Refresh quota data"
          >
            <RefreshCw
              size={14}
              className={cn(isRefreshing && "animate-spin")}
            />
            <span>Refresh</span>
          </button>
        )}

        <button
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-elevated)] transition-colors duration-150"
          )}
          title="Notifications"
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
