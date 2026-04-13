import { invoke } from "@tauri-apps/api/core";
import type { Account } from "../../types/account";

/**
 * Tauri IPC wrapper for OAuth operations.
 *
 * All functions map to Rust `#[tauri::command]` handlers
 * defined in `src-tauri/src/commands/oauth.rs`.
 */

/** Response from prepare_oauth command. */
export interface OAuthPrepareResult {
  authUrl: string;
  port: number;
}

/** Generates the OAuth URL and prepares the local callback server. */
export async function prepareOAuth(): Promise<OAuthPrepareResult> {
  return invoke<OAuthPrepareResult>("prepare_oauth");
}

/** Waits for the OAuth callback on the given port. Blocks until done. */
export async function waitForOAuthCallback(port: number): Promise<Account> {
  return invoke<Account>("wait_for_oauth_callback", { port });
}

/** Cancels any pending OAuth flow. */
export async function cancelOAuth(): Promise<void> {
  return invoke<void>("cancel_oauth");
}

/** Completes OAuth using a manually-pasted callback URL. */
export async function submitOAuthCallback(callbackUrl: string): Promise<Account> {
  return invoke<Account>("submit_oauth_callback", { callbackUrl });
}

/** Imports an account using a raw refresh token. */
export async function importWithToken(
  refreshToken: string,
  label?: string
): Promise<Account> {
  return invoke<Account>("import_with_token", { refreshToken, label });
}

/** Imports the account from the local Antigravity installation. */
export async function importFromAntigravity(): Promise<Account> {
  return invoke<Account>("import_from_antigravity");
}
