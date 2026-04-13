import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Zap,
  Shield,
  AlertTriangle,
  XCircle,
  Edit3,
  Check,
  X,
  Mail,
  Key,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { getStatusColor } from "../../utils/formatters";
import { useAccountStore } from "../../stores/accountStore";
import type { Account } from "../../types/account";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

/**
 * Accounts management page.
 *
 * Displays all stored accounts as cards with status badges,
 * and provides add/edit/remove/switch functionality connected
 * to the Rust backend.
 */
export function AccountList() {
  const { accounts, isLoading, error, fetchAccounts, switchAccount, removeAccount, addAccount } =
    useAccountStore();

  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const activeAccount = accounts.find((a) => a.isActive);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {accounts.length} Account{accounts.length !== 1 && "s"}
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-[var(--accent-primary)] text-white",
            "hover:brightness-110 transition-all duration-150",
            "shadow-lg shadow-[var(--accent-primary)]/20"
          )}
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent-danger-soft)] text-[var(--accent-danger)] text-sm">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Account Cards ── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : accounts.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <motion.div className="space-y-3" initial="hidden" animate="visible">
          <AnimatePresence>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                isActive={account.id === activeAccount?.id}
                onSwitch={() => switchAccount(account.id)}
                onRemove={() => removeAccount(account.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add Account Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddAccountModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (email, token, label) => {
              const result = await addAccount({ email, refreshToken: token, label });
              if (result) setShowAddModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

interface AccountCardProps {
  account: Account;
  isActive: boolean;
  onSwitch: () => void;
  onRemove: () => void;
}

function AccountCard({ account, isActive, onSwitch, onRemove }: AccountCardProps) {
  const statusIcon = {
    active: <Shield size={14} />,
    rate_limited: <AlertTriangle size={14} />,
    expired: <XCircle size={14} />,
    error: <XCircle size={14} />,
  }[account.status];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "bg-[var(--bg-surface)] border",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "transition-all duration-200",
        isActive
          ? "border-[var(--accent-primary)]/40 ring-1 ring-[var(--accent-primary)]/20"
          : "border-[var(--border-subtle)]"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold",
          isActive
            ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
            : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
        )}
      >
        {account.email.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {account.label || account.email}
          </span>
          {isActive && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)] truncate">{account.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium", getStatusColor(account.status))}>
            {statusIcon}
            {account.status.replace("_", " ")}
          </span>
          {account.plan !== "unknown" && (
            <span className="text-[10px] text-[var(--text-muted)] uppercase">{account.plan}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!isActive && (
          <button
            onClick={onSwitch}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
              "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
              "hover:bg-[var(--accent-primary)]/20 transition-colors"
            )}
            title="Activate this account"
          >
            <Zap size={12} />
            Activate
          </button>
        )}
        <button
          onClick={onRemove}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            "text-[var(--text-muted)] hover:text-[var(--accent-danger)]",
            "hover:bg-[var(--accent-danger-soft)] transition-colors"
          )}
          title="Remove account"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Add Account Modal ── */

interface AddAccountModalProps {
  onClose: () => void;
  onAdd: (email: string, token: string, label?: string) => Promise<void>;
}

function AddAccountModal({ onClose, onAdd }: AddAccountModalProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !token.trim()) return;
    setIsSubmitting(true);
    await onAdd(email.trim(), token.trim(), label.trim() || undefined);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={cn(
          "w-full max-w-md p-6 rounded-2xl",
          "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
          "shadow-[var(--shadow-lg)]"
        )}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Account</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              <Mail size={12} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className={cn(
                "w-full px-3 py-2.5 rounded-lg text-sm",
                "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
                "text-[var(--text-primary)] placeholder-[var(--text-muted)]",
                "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
                "transition-colors"
              )}
            />
          </div>

          {/* Token */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              <Key size={12} /> Refresh Token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Antigravity refresh token here..."
              required
              rows={3}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg text-sm resize-none",
                "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
                "text-[var(--text-primary)] placeholder-[var(--text-muted)]",
                "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
                "transition-colors"
              )}
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Your token is encrypted with AES-256-GCM before storage.
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              <Edit3 size={12} /> Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g., "Work", "Personal"'
              className={cn(
                "w-full px-3 py-2.5 rounded-lg text-sm",
                "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
                "text-[var(--text-primary)] placeholder-[var(--text-muted)]",
                "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
                "transition-colors"
              )}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                "hover:bg-[var(--bg-elevated)] transition-colors"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !token.trim()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-[var(--accent-primary)] text-white",
                "hover:brightness-110 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>Encrypting...</>
              ) : (
                <>
                  <Check size={14} /> Add Account
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
        <Shield size={28} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        No accounts yet
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
        Add your first Antigravity account to start monitoring quotas and managing your AI IDE sessions.
      </p>
      <button
        onClick={onAdd}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
          "bg-[var(--accent-primary)] text-white",
          "hover:brightness-110 transition-all",
          "shadow-lg shadow-[var(--accent-primary)]/20"
        )}
      >
        <Plus size={16} />
        Add Your First Account
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-shimmer"
        />
      ))}
    </div>
  );
}
