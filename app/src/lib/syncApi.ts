import type { AppData } from "../types";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4001/api";

export async function pullRemoteData(token: string): Promise<AppData | null> {
  const res = await fetch(`${API_BASE}/data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to pull data (${res.status})`);
  const body = await res.json();
  return body.appData as AppData | null;
}

export async function pushRemoteData(token: string, data: AppData): Promise<void> {
  const res = await fetch(`${API_BASE}/data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appData: data }),
  });
  if (!res.ok) throw new Error(`Failed to push data (${res.status})`);
}
