export const API_URL = process.env.REACT_APP_API_URL || "https://familytree-backend-6lq7.onrender.com";
export const SOCKETS_URL = process.env.REACT_APP_SOCKETS_URL || "wss://familytree-backend-6lq7.onrender.com";
export const NODE_ENV = process.env.NODE_ENV || "development";

// ─── CSRF ─────────────────────────────────────────────────────────────────────
// Holds the token in memory — never stored in localStorage (XSS risk).
// Automatically fetched on first use; refreshed after login/logout by calling
// resetCsrfToken() so the old token is never reused across sessions.
let csrfToken = null;

async function fetchCsrfToken() {
  const res = await fetch(`${API_URL}/csrf-token`, {
    credentials: "include", // must send the csrf cookie
  });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const data = await res.json();
  csrfToken = data.csrfToken;
}

// Call this after login or logout so the token is always session-fresh
export function resetCsrfToken() {
  csrfToken = null;
}

// ─── apiFetch ─────────────────────────────────────────────────────────────────
// Drop-in replacement for fetch() for all calls to your backend.
// Automatically:
//   • Attaches credentials (cookies)
//   • Fetches a CSRF token on first mutating request and caches it
//   • Sets x-csrf-token header on POST / PUT / PATCH / DELETE requests
//
// Usage (same signature as fetch):
//   import { apiFetch } from "../shared";
//   const res = await apiFetch("/api/users", { method: "POST", body: JSON.stringify(data) });
// ─────────────────────────────────────────────────────────────────────────────
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isMutating = MUTATING_METHODS.has(method);

  // Lazily fetch the CSRF token the first time a mutating request is made
  if (isMutating && !csrfToken) {
    await fetchCsrfToken();
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(isMutating ? { "x-csrf-token": csrfToken } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // always send cookies
  });

  // If the server says the CSRF token is stale (e.g. after a server restart),
  // fetch a fresh one and retry the request exactly once.
  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.error === "Invalid or missing CSRF token") {
      await fetchCsrfToken();
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...headers, "x-csrf-token": csrfToken },
        credentials: "include",
      });
    }
  }

  return res;
}