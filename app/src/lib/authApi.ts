export interface AuthUser {
  id: string;
  email: string;
  name: string;
  appData: unknown | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/** Thrown when the server actually responded (e.g. 401 invalid/expired token) — as opposed to a network-level failure (no connection), which throws a plain TypeError instead and should NOT log the user out. */
export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4001/api";

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError((body as { error?: string }).error || `Request failed (${res.status})`, res.status);
  return body as T;
}

export function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  return fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  }).then(json<AuthResponse>);
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then(json<AuthResponse>);
}

export function googleSignIn(idToken: string): Promise<AuthResponse> {
  return fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  }).then(json<AuthResponse>);
}

export function fetchMe(token: string): Promise<{ user: AuthUser }> {
  return fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(json<{ user: AuthUser }>);
}

export function deleteAccount(token: string): Promise<{ success: boolean }> {
  return fetch(`${API_BASE}/auth/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(json<{ success: boolean }>);
}

export function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).then(json<{ success: boolean; message: string }>);
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
  return fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  }).then(json<AuthResponse>);
}

export function changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  return fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(json<{ success: boolean }>);
}