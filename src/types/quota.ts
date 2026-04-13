/**
 * Type definitions for quota monitoring data.
 */

/** Quota information for a single AI model */
export interface ModelQuota {
  /** Model identifier (e.g., "gemini-pro", "claude-sonnet") */
  model: string;

  /** Human-readable model name */
  displayName: string;

  /** Number of requests/tokens used in current period */
  used: number;

  /** Total quota limit for current period */
  total: number;

  /** ISO 8601 timestamp when this quota resets */
  resetsAt: string | null;

  /** ISO 8601 timestamp when this data was last fetched */
  fetchedAt: string;
}

/** Complete quota status for an account */
export interface QuotaStatus {
  /** Account ID this quota belongs to */
  accountId: string;

  /** Individual model quotas */
  models: ModelQuota[];

  /** ISO 8601 timestamp of the last successful fetch */
  lastUpdated: string;

  /** Whether the quota fetch was successful */
  success: boolean;

  /** Error message if the fetch failed */
  error?: string;
}

/** Historical quota snapshot for trend analysis */
export interface QuotaSnapshot {
  /** Model identifier */
  model: string;

  /** Usage at time of snapshot */
  used: number;

  /** Total at time of snapshot */
  total: number;

  /** When this snapshot was taken */
  fetchedAt: string;
}
