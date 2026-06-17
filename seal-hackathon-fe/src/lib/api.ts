const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://localhost:7266/api";

// Authentication is handled entirely via the HttpOnly cookie set by the backend,
// which `credentials: "include"` (below) sends on every request. There is no
// per-call auth toggle, so RequestOptions is just the standard fetch init.
type RequestOptions = RequestInit;

export type CurrentUser = {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: string;
  roles: string[];
  phoneNumber?: string | null;
  studentCode?: string | null;
  schoolName?: string | null;
  studentType?: string | null;
  developerRole?: string | null;
  programmingLanguages?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Error thrown for non-OK API responses. Carries the HTTP status so callers
 * can distinguish auth failures (401/403) from transient/network problems —
 * a network blip must never be treated as an expired session.
 * `status` is 0 for client-side failures (timeout/abort).
 */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

const REQUEST_TIMEOUT_MS = 20_000;

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (Array.isArray(data)) {
      const descriptions = data
        .map((item) => (isRecord(item) && typeof item.description === "string" ? item.description : ""))
        .filter(Boolean)
        .join(", ");

      if (descriptions) {
        message = descriptions;
      }
    } else if (isRecord(data)) {
      if (typeof data.message === "string") {
        message = data.message;
      } else if (typeof data.title === "string") {
        message = data.title;
      }
    }

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Combine the caller's signal (if any) with our timeout signal so BOTH can
  // cancel the fetch. Plain `options.signal ?? controller.signal` was a bug:
  // when the caller passed their own signal, the 20s timer fired but the fetch
  // wasn't listening to it.
  const combinedSignal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      signal: combinedSignal,
    });

    return await parseResponse<T>(response);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Distinguish our 20s timeout from a caller-initiated cancel. If the
      // caller's signal aborted, surface that as-is; otherwise it was our timer.
      if (options.signal?.aborted) throw err;
      throw new ApiError("Request timed out. Please check your connection and try again.", 0);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiUpload<T>(path: string, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  return parseResponse<T>(response);
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(`Download failed with status ${response.status}`, response.status);
  }

  return response.blob();
}

export function toCurrentUser(user: {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  roles?: string[];
  role?: string;
  phoneNumber?: string | null;
  studentCode?: string | null;
  schoolName?: string | null;
  studentType?: string | null;
  developerRole?: string | null;
  programmingLanguages?: string[];
}): CurrentUser {
  const roles = user.roles?.length ? user.roles : [user.role ?? "Member"];
  const fullName = user.fullName ?? user.name ?? user.email;

  return {
    id: user.id,
    name: fullName,
    fullName,
    email: user.email,
    role: roles[0] ?? "Member",
    roles,
    phoneNumber: user.phoneNumber,
    studentCode: user.studentCode,
    schoolName: user.schoolName,
    studentType: user.studentType,
    developerRole: user.developerRole,
    programmingLanguages: user.programmingLanguages ?? [],
  };
}

// Identity comes strictly from the backend cookie + /Auth/me. We deliberately
// do NOT mirror `currentUser` into localStorage/sessionStorage — client storage
// is trivially forgeable, so treating it as the source of truth for role gates
// was a trust-boundary bug. The AuthProvider holds the in-memory user; consumers
// read it via useAuth(). See memory/auth-trust-boundary.md.
export async function fetchCurrentUser() {
  const user = await apiRequest<{
    id: string;
    fullName: string;
    email: string;
    roles: string[];
    phoneNumber?: string | null;
    studentCode?: string | null;
    schoolName?: string | null;
    studentType?: string | null;
    developerRole?: string | null;
    programmingLanguages?: string[];
  }>("/Auth/me");

  return toCurrentUser(user);
}

export async function clearAuthSession() {
  try {
    await apiRequest("/Auth/logout", { method: "POST" });
  } catch {
    // Logout may be unavailable on older backends; the AuthProvider will still
    // drop the in-memory user, which is the only thing the UI trusts.
  }
}
