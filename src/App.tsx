import { useEffect, useState } from "react";
import { Sidebar, type PageId } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./components/dashboard/Dashboard";
import { AccountList } from "./components/accounts/AccountList";
import { Settings } from "./components/settings/Settings";
import { useAccountStore } from "./stores/accountStore";
import { detectAntigravity } from "./services/tauri/platform";
import "./styles/globals.css";
import "./styles/animations.css";

import type { ModelQuota } from "./types/quota";

/**
 * Root application component.
 *
 * Manages top-level routing between pages and provides the
 * overall app layout with sidebar navigation. Connects to the
 * Rust backend on mount to load initial data.
 */
function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [antigravityInstalled, setAntigravityInstalled] = useState<boolean | null>(null);

  const { accounts, fetchAccounts } = useAccountStore();
  const activeAccount = accounts.find((a) => a.isActive) || null;

  // Load initial data from the backend on mount
  useEffect(() => {
    fetchAccounts();

    detectAntigravity()
      .then((info) => setAntigravityInstalled(info.isInstalled))
      .catch(() => setAntigravityInstalled(false));
  }, [fetchAccounts]);

  // Placeholder quota data — will be replaced when quota API is integrated
  const mockQuotas: ModelQuota[] = activeAccount
    ? [
        {
          model: "gemini-2.5-pro",
          displayName: "Gemini 2.5 Pro",
          used: 142,
          total: 500,
          resetsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          fetchedAt: new Date().toISOString(),
        },
        {
          model: "gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          used: 890,
          total: 1500,
          resetsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          fetchedAt: new Date().toISOString(),
        },
        {
          model: "claude-sonnet-4",
          displayName: "Claude Sonnet 4",
          used: 45,
          total: 50,
          resetsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          fetchedAt: new Date().toISOString(),
        },
        {
          model: "gemini-2.5-image",
          displayName: "Image Generation",
          used: 12,
          total: 100,
          resetsAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          fetchedAt: new Date().toISOString(),
        },
      ]
    : [];

  const pageConfig: Record<PageId, { title: string; subtitle?: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: antigravityInstalled === false
        ? "⚠️ Antigravity not detected"
        : "Real-time quota overview",
    },
    accounts: {
      title: "Accounts",
      subtitle: `Manage your Antigravity accounts (${accounts.length})`,
    },
    settings: {
      title: "Settings",
      subtitle: "Customize your experience",
    },
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAccounts();
    // Simulated quota refresh — will be replaced with real API calls
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsRefreshing(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            activeAccount={activeAccount}
            quotas={mockQuotas}
            totalAccounts={accounts.length}
            isLoading={false}
          />
        );
      case "accounts":
        return <AccountList />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-base)] dark">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title={pageConfig[activePage].title}
          subtitle={pageConfig[activePage].subtitle}
          onRefresh={activePage === "dashboard" ? handleRefresh : undefined}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
