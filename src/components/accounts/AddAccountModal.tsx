import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Globe,
  Key,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  ClipboardPaste,
  Edit3,
  Shield,
} from "lucide-react";
import { cn } from "../../utils/cn";

import {
  prepareOAuth,
  waitForOAuthCallback,
  cancelOAuth,
  importWithToken,
  importFromAntigravity,
} from "../../services/tauri/oauth";
import type { Account } from "../../types/account";

type TabId = "oauth" | "token" | "import";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "oauth",
    label: "Google OAuth",
    icon: <Globe size={16} />,
    description: "Authorize with your Google account via browser",
  },
  {
    id: "token",
    label: "Refresh Token",
    icon: <Key size={16} />,
    description: "Paste a refresh token directly",
  },
  {
    id: "import",
    label: "Import",
    icon: <Download size={16} />,
    description: "Import from local Antigravity installation",
  },
];

type ModalStatus = "idle" | "loading" | "success" | "error";

interface AddAccountModalProps {
  onClose: () => void;
  onSuccess: (account: Account) => void;
}

export function AddAccountModal({ onClose, onSuccess }: AddAccountModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("oauth");
  const [status, setStatus] = useState<ModalStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSuccess = useCallback(
    (account: Account) => {
      setStatus("success");
      setStatusMessage(`Account ${account.email} added successfully!`);
      onSuccess(account);
      setTimeout(() => onClose(), 1500);
    },
    [onClose, onSuccess]
  );

  const handleError = useCallback((msg: string) => {
    setStatus("error");
    setStatusMessage(msg);
  }, []);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setStatusMessage("");
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={cn(
          "w-full max-w-lg rounded-2xl overflow-hidden",
          "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
          "shadow-[var(--shadow-lg)]"
        )}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Add Account
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Choose how to add your Antigravity account
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-elevated)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex px-6 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                resetStatus();
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Description ── */}
        <div className="px-6 pt-2 pb-1">
          <p className="text-[11px] text-[var(--text-muted)]">
            {TABS.find((t) => t.id === activeTab)?.description}
          </p>
        </div>

        {/* ── Status Banner ── */}
        <AnimatePresence>
          {status !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6"
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs mt-2",
                  status === "loading" &&
                    "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
                  status === "success" &&
                    "bg-emerald-500/10 text-emerald-400",
                  status === "error" &&
                    "bg-[var(--accent-danger-soft)] text-[var(--accent-danger)]"
                )}
              >
                {status === "loading" && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {status === "success" && <CheckCircle2 size={14} />}
                {status === "error" && <AlertCircle size={14} />}
                <span className="flex-1">{statusMessage}</span>
                {status === "error" && (
                  <button
                    onClick={resetStatus}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tab Content ── */}
        <div className="px-6 py-4 min-h-[200px]">
          {activeTab === "oauth" && (
            <OAuthTab
              status={status}
              onSuccess={handleSuccess}
              onError={handleError}
              onStatusChange={(s, m) => {
                setStatus(s);
                setStatusMessage(m);
              }}
            />
          )}
          {activeTab === "token" && (
            <TokenTab
              status={status}
              onSuccess={handleSuccess}
              onError={handleError}
              onStatusChange={(s, m) => {
                setStatus(s);
                setStatusMessage(m);
              }}
            />
          )}
          {activeTab === "import" && (
            <ImportTab
              status={status}
              onSuccess={handleSuccess}
              onError={handleError}
              onStatusChange={(s, m) => {
                setStatus(s);
                setStatusMessage(m);
              }}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 pt-1">
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <Shield size={10} />
            <span>
              All tokens are encrypted with AES-256-GCM before local storage.
              Nothing is sent to external servers.
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   Tab 1: Google OAuth
   ══════════════════════════════════════════════════════════ */

interface TabProps {
  status: ModalStatus;
  onSuccess: (account: Account) => void;
  onError: (msg: string) => void;
  onStatusChange: (status: ModalStatus, message: string) => void;
}

function OAuthTab({ status, onSuccess, onError, onStatusChange }: TabProps) {
  const [authUrl, setAuthUrl] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const abortRef = useRef(false);

  const startOAuth = useCallback(async () => {
    try {
      abortRef.current = false;
      onStatusChange("loading", "Preparing OAuth authorization...");

      // Step 1: Get auth URL and port
      const { authUrl, port } = await prepareOAuth();
      setAuthUrl(authUrl);

      // Step 2: Open browser
      window.open(authUrl, "_blank");
      onStatusChange(
        "loading",
        "Waiting for authorization in your browser..."
      );
      setIsWaiting(true);

      // Step 3: Wait for callback
      const account = await waitForOAuthCallback(port);

      if (!abortRef.current) {
        onSuccess(account);
      }
    } catch (err: any) {
      if (!abortRef.current) {
        onError(err?.toString?.() || "OAuth flow failed");
      }
    } finally {
      setIsWaiting(false);
    }
  }, [onSuccess, onError, onStatusChange]);

  const handleCancel = useCallback(async () => {
    abortRef.current = true;
    await cancelOAuth();
    setIsWaiting(false);
    onStatusChange("idle", "");
  }, [onStatusChange]);

  const handleCopyUrl = useCallback(() => {
    if (authUrl) {
      navigator.clipboard.writeText(authUrl);
    }
  }, [authUrl]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-3">
          <Globe size={24} className="text-[var(--accent-primary)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
          Sign in with your Google account to automatically import your
          Antigravity credentials.
        </p>
      </div>

      {!isWaiting ? (
        <button
          onClick={startOAuth}
          disabled={status === "loading" || status === "success"}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold",
            "bg-[var(--accent-primary)] text-white",
            "hover:brightness-110 transition-all duration-150",
            "shadow-lg shadow-[var(--accent-primary)]/25",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ExternalLink size={16} />
          Sign in with Google
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 py-3">
            <Loader2 size={20} className="animate-spin text-[var(--accent-primary)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Waiting for browser authorization...
            </span>
          </div>

          {authUrl && (
            <button
              onClick={handleCopyUrl}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs",
                "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
                "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                "transition-colors"
              )}
            >
              <Copy size={12} />
              Copy authorization URL
            </button>
          )}

          <button
            onClick={handleCancel}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-xs font-medium",
              "text-[var(--accent-danger)] hover:bg-[var(--accent-danger-soft)]",
              "transition-colors"
            )}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Tab 2: Refresh Token (Manual)
   ══════════════════════════════════════════════════════════ */

function TokenTab({ status, onSuccess, onError, onStatusChange }: TabProps) {
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token.trim()) return;

      try {
        onStatusChange("loading", "Validating token and fetching account info...");
        const account = await importWithToken(
          token.trim(),
          label.trim() || undefined
        );
        onSuccess(account);
      } catch (err: any) {
        onError(err?.toString?.() || "Token import failed");
      }
    },
    [token, label, onSuccess, onError, onStatusChange]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Token */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          <Key size={12} /> Refresh Token
        </label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your Google/Antigravity refresh token here (e.g., 1//0g...)"
          required
          rows={3}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg text-sm resize-none font-mono",
            "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
            "text-[var(--text-primary)] placeholder-[var(--text-muted)]",
            "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
            "transition-colors"
          )}
        />
        <p className="text-[10px] text-[var(--text-muted)] mt-1">
          The token will be validated against Google's API to verify it's valid.
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
      <button
        type="submit"
        disabled={status === "loading" || status === "success" || !token.trim()}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold",
          "bg-[var(--accent-primary)] text-white",
          "hover:brightness-110 transition-all duration-150",
          "shadow-lg shadow-[var(--accent-primary)]/25",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Validating...
          </>
        ) : (
          <>
            <ClipboardPaste size={14} />
            Import Token
          </>
        )}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════
   Tab 3: Import from Local Antigravity
   ══════════════════════════════════════════════════════════ */

function ImportTab({ status, onSuccess, onError, onStatusChange }: TabProps) {
  const handleImport = useCallback(async () => {
    try {
      onStatusChange("loading", "Scanning Antigravity installation...");
      const account = await importFromAntigravity();
      onSuccess(account);
    } catch (err: any) {
      onError(err?.toString?.() || "Import failed");
    }
  }, [onSuccess, onError, onStatusChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
          <Download size={24} className="text-emerald-400" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
          Automatically detect and import the account from your local
          Antigravity IDE installation.
        </p>
      </div>

      <div
        className={cn(
          "p-3 rounded-lg text-[11px] space-y-1",
          "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
        )}
      >
        <p className="font-medium text-[var(--text-secondary)]">Requirements:</p>
        <ul className="list-disc list-inside text-[var(--text-muted)] space-y-0.5">
          <li>Antigravity IDE must be installed</li>
          <li>You must be logged in to Antigravity</li>
          <li>
            Auth files must exist in{" "}
            <code className="px-1 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] text-[10px]">
              %APPDATA%\Antigravity
            </code>
          </li>
        </ul>
      </div>

      <button
        onClick={handleImport}
        disabled={status === "loading" || status === "success"}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold",
          "bg-emerald-500/90 text-white",
          "hover:bg-emerald-500 transition-all duration-150",
          "shadow-lg shadow-emerald-500/25",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Download size={14} />
            Import from Antigravity
          </>
        )}
      </button>
    </div>
  );
}
