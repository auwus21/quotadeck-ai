import { create } from "zustand";
import type { Account, AddAccountPayload, UpdateAccountPayload } from "../types/account";
import * as accountApi from "../services/tauri/accounts";

/**
 * Account store state and actions.
 *
 * Manages the list of Antigravity accounts, including CRUD
 * operations that sync with the Rust backend via Tauri IPC.
 */
interface AccountState {
  /** All accounts from the local database */
  accounts: Account[];

  /** Whether accounts are currently being loaded */
  isLoading: boolean;

  /** Error message from the last failed operation */
  error: string | null;

  /** Fetches all accounts from the backend */
  fetchAccounts: () => Promise<void>;

  /** Adds a new account */
  addAccount: (payload: AddAccountPayload) => Promise<Account | null>;

  /** Updates an existing account */
  updateAccount: (payload: UpdateAccountPayload) => Promise<void>;

  /** Removes an account */
  removeAccount: (id: string) => Promise<void>;

  /** Switches the active account */
  switchAccount: (id: string) => Promise<void>;

  /** Clears the current error */
  clearError: () => void;
}

/**
 * Zustand store for account management.
 *
 * @example
 * ```tsx
 * function AccountList() {
 *   const { accounts, fetchAccounts } = useAccountStore();
 *   useEffect(() => { fetchAccounts(); }, []);
 *   return accounts.map(a => <div>{a.email}</div>);
 * }
 * ```
 */
export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await accountApi.getAccounts();
      set({ accounts, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addAccount: async (payload) => {
    set({ error: null });
    try {
      const newAccount = await accountApi.addAccount(payload);
      // Refresh the full list to ensure consistency
      await get().fetchAccounts();
      return newAccount;
    } catch (err) {
      set({ error: String(err) });
      return null;
    }
  },

  updateAccount: async (payload) => {
    set({ error: null });
    try {
      await accountApi.updateAccount(payload);
      await get().fetchAccounts();
    } catch (err) {
      set({ error: String(err) });
    }
  },

  removeAccount: async (id) => {
    set({ error: null });
    try {
      await accountApi.removeAccount(id);
      await get().fetchAccounts();
    } catch (err) {
      set({ error: String(err) });
    }
  },

  switchAccount: async (id) => {
    set({ error: null });
    try {
      await accountApi.switchAccount(id);
      await get().fetchAccounts();
    } catch (err) {
      set({ error: String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
