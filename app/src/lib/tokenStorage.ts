import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser } from "./authApi";

const TOKEN_KEY = "vital-tracker:auth-token:v1";
const USER_KEY = "vital-tracker:cached-user:v1";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/** A locally cached copy of the last known user, so the app can open offline for an already-logged-in user. */
export async function getCachedUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function setCachedUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearCachedUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
