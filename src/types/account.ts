/**
 * Type definitions for Antigravity account data.
 *
 * These types define the shape of account data as it flows between
 * the frontend UI, Zustand stores, and Tauri IPC bridge.
 */

/** Possible states for an account */
export type AccountStatus = "active" | "rate_limited" | "expired" | "error";

/** Represents a single Antigravity account stored locally */
export interface Account {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Email address associated with this account */
  email: string;

  /** User-defined label for quick identification (e.g., "Work", "Personal") */
  label: string;

  /** Subscription plan type (e.g., "free", "pro", "enterprise") */
  plan: string;

  /** Whether this account is currently active in Antigravity */
  isActive: boolean;

  /** Current status of the account */
  status: AccountStatus;

  /** ISO 8601 timestamp of when this account was added */
  createdAt: string;

  /** ISO 8601 timestamp of last modification */
  updatedAt: string;

  /** ISO 8601 timestamp of when this account was last activated */
  lastUsed: string | null;
}

/** Payload for adding a new account */
export interface AddAccountPayload {
  email: string;
  refreshToken: string;
  label?: string;
}

/** Payload for updating an existing account */
export interface UpdateAccountPayload {
  id: string;
  label?: string;
}
