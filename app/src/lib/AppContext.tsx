import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { AppData } from "../types";
import { loadData } from "./store";
import { getTheme, type Theme } from "../theme";
import { getStoredToken } from "./tokenStorage";
import { pushRemoteData } from "./syncApi";

interface AppContextValue {
  data: AppData | null;
  theme: Theme;
  loading: boolean;
  refresh: (updated: AppData) => void;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const SYNC_DEBOUNCE_MS = 1500;

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    const loaded = await loadData();
    setData(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Debounced push to the backend whenever local data changes, if the user is signed in.
  // Local storage (via store.ts's mutation functions) is always the source of truth for the
  // instant UI update — this just mirrors it up to the account asynchronously in the background.
  const scheduleSync = useCallback((updated: AppData) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const token = await getStoredToken();
      if (!token) return;
      try {
        await pushRemoteData(token, updated);
      } catch (err) {
        console.error("[AppContext] background sync push failed:", err);
      }
    }, SYNC_DEBOUNCE_MS);
  }, []);

  const refresh = useCallback(
    (updated: AppData) => {
      setData(updated);
      scheduleSync(updated);
    },
    [scheduleSync]
  );

  const theme = getTheme(data?.settings.theme ?? "light");

  return <AppContext.Provider value={{ data, theme, loading, refresh, reload }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
