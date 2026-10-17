const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "school_enterprise_teacher_token";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.authenticated === false ? null : getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    throw new Error("Cannot reach the School Enterprise API.");
  }

  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("teacher:session-expired"));
  }
  if (!response.ok || !payload || payload.success !== true) {
    throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status);
  }
  return payload.data;
}
