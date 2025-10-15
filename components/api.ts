// components/api.ts
type Options = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    token?: string;
    timeoutMs?: number;
};

export const API_ROOT = "https://back-billar.vercel.app"; // <- tu Vercel
const BASE = `${API_ROOT.replace(/\/$/, "")}/api`;

export async function api(path: string, opts: Options = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);

    const url = path.startsWith("http")
        ? path
        : `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

    const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: {
            "Content-Type": "application/json",
            ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
            ...(opts.headers ?? {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
    }).catch(() => {
        clearTimeout(t);
        throw new Error("No se pudo conectar con el servidor.");
    });

    clearTimeout(t);

    let json: any = null;
    try { json = await res.json(); } catch { }

    if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || "Ocurrió un error inesperado.");
    }
    return json;
}
