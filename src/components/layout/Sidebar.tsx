import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { APP_NAME } from "../../utils/constants";

/** Navigation items for the sidebar */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type PageId = (typeof NAV_ITEMS)[number]["id"];

interface SidebarProps {
  /** Currently active page */
  activePage: PageId;
  /** Callback when a navigation item is clicked */
  onNavigate: (page: PageId) => void;
}

/**
 * Main sidebar navigation component.
 *
 * Provides collapsible navigation with animated transitions.
 * Always visible on the left side of the application.
 */
export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      className={cn(
        "flex flex-col h-screen border-r",
        "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
      )}
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* ── Brand Header ── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent-primary)] shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation Items ── */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-150",
                "hover:bg-[var(--bg-elevated)]",
                isActive
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* ── Collapse Toggle ── */}
      <div className="p-2 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center justify-center w-full py-2 rounded-lg",
            "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-elevated)] transition-colors duration-150"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
