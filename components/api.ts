// components/api.ts
import { Platform } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000");

type Options = {
  method?: "GET"|"POST"|"PUT"|"PATCH"|"DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  timeoutMs?: number;
};

export async function api(path: string, opts: Options = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: controller.signal,
  }).catch((e) => {
    clearTimeout(t);
    throw new Error("No se pudo conectar con el servidor.");
  });

  clearTimeout(t);

  let json: any = null;
  try { json = await res.json(); } catch { /* ignore */ }

  if (!res.ok) {
    const msg = json?.message || "Ocurrió un error inesperado.";
    throw new Error(msg);
  }
  return json;
}
