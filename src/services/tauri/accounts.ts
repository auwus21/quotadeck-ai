import { invoke } from "@tauri-apps/api/core";
import type { Account, AddAccountPayload, UpdateAccountPayload } from "../../types/account";

/**
 * Tauri IPC wrapper for account operations.
 *
 * All functions map to Rust `#[tauri::command]` handlers
 * defined in `src-tauri/src/commands/accounts.rs`.
 */

/** Fetches all accounts from the local database. */
export async function getAccounts(): Promise<Account[]> {
  return invoke<Account[]>("get_accounts");
}

/** Adds a new account with encrypted token storage. */
export async function addAccount(payload: AddAccountPayload): Promise<Account> {
  return invoke<Account>("add_account", { payload });
}

/** Updates an existing account's metadata. */
export async function updateAccount(payload: UpdateAccountPayload): Promise<Account> {
  return invoke<Account>("update_account", { payload });
}

/** Removes an account from the database. */
export async function removeAccount(id: string): Promise<void> {
  return invoke<void>("remove_account", { id });
}

/** Switches the active account (deactivates current, activates target). */
export async function switchAccount(id: string): Promise<Account> {
  return invoke<Account>("switch_account", { id });
}
