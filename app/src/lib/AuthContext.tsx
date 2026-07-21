import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import * as authApi from "./authApi";
import { pullRemoteData, pushRemoteData } from "./syncApi";
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getCachedUser,
  setCachedUser,
  clearCachedUser,
} from "./tokenStorage";
import { saveData, defaultData } from "./store";

interface AuthContextValue {
  user: authApi.AuthUser | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  signup: (email: string, password: string, name: string, initialWeightKg?: number) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * After any successful auth (signup, login, or Google), reconcile local storage with the
 * server: if the account already has synced data (returning user / new device), pull it down
 * and overwrite local storage. If it's a brand-new account with nothing synced yet, start
 * fresh locally (per product decision — pre-existing local data on this device is not imported)
 * and push that fresh baseline up so the account has something to sync from now on.
 */
async function reconcileDataAfterAuth(token: string, initialWeightKg?: number): Promise<void> {
  const remote = await pullRemoteData(token);
  if (remote) {
    await saveData(remote);
  } else {
    const fresh = defaultData();
    if (initialWeightKg && initialWeightKg > 0) {
      fresh.settings.defaultWeightKg = initialWeightKg;
      fresh.weights = [{ id: `${Date.now()}`, date: new Date().toISOString().slice(0, 10), weightKg: initialWeightKg }];
    }
    await saveData(fresh);
    await pushRemoteData(token, fresh);
  }
}

/** True for a network-level failure (no connection / server unreachable) rather than a real auth rejection. */
function isNetworkError(err: unknown): boolean {
  return !(err instanceof authApi.AuthApiError);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user: fetchedUser } = await authApi.fetchMe(token);
        await reconcileDataAfterAuth(token);
        await setCachedUser(fetchedUser);
        setUser(fetchedUser);
        setOffline(false);
      } catch (err) {
        if (isNetworkError(err)) {
          // Can't reach the server right now — fall back to the last-known session and
          // whatever data is already cached locally, instead of logging the user out.
          const cached = await getCachedUser();
          if (cached) {
            setUser(cached);
            setOffline(true);
          }
        } else {
          // The server explicitly rejected the token (expired/invalid) — this is a real logout.
          await clearStoredToken();
          await clearCachedUser();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, initialWeightKg?: number) => {
    setError(null);
    try {
      const { token, user: newUser } = await authApi.signup(email, password, name);
      await setStoredToken(token);
      await reconcileDataAfterAuth(token, initialWeightKg);
      await setCachedUser(newUser);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      throw err;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { token, user: loggedInUser } = await authApi.login(email, password);
      await setStoredToken(token);
      await reconcileDataAfterAuth(token);
      await setCachedUser(loggedInUser);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    }
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    setError(null);
    try {
      const { token, user: googleUser } = await authApi.googleSignIn(idToken);
      await setStoredToken(token);
      await reconcileDataAfterAuth(token);
      await setCachedUser(googleUser);
      setUser(googleUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await clearStoredToken();
    await clearCachedUser();
    await saveData(defaultData()); // clear local cache so the next account doesn't inherit this one's data
    setUser(null);
    setOffline(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    setError(null);
    const token = await getStoredToken();
    if (!token) throw new Error("Not logged in");
    try {
      await authApi.deleteAccount(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      throw err;
    }
    // Same local cleanup as logout — the account and its server-side data are already gone at this point.
    await clearStoredToken();
    await clearCachedUser();
    await saveData(defaultData());
    setUser(null);
    setOffline(false);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setError(null);
    try {
      await authApi.forgotPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
      throw err;
    }
  }, []);

  const resetPasswordWithCode = useCallback(async (email: string, code: string, newPassword: string) => {
    setError(null);
    try {
      const { token, user: resetUser } = await authApi.resetPassword(email, code, newPassword);
      await setStoredToken(token);
      await reconcileDataAfterAuth(token);
      await setCachedUser(resetUser);
      setUser(resetUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setError(null);
    const token = await getStoredToken();
    if (!token) throw new Error("Not logged in");
    try {
      await authApi.changePassword(token, currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        offline,
        signup,
        login,
        loginWithGoogleIdToken,
        logout,
        deleteAccount,
        requestPasswordReset,
        resetPasswordWithCode,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}