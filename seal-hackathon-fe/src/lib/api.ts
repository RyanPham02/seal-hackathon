const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://localhost:7266/api";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export type CurrentUser = {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: string;
  roles: string[];
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("seal_token") ?? sessionStorage.getItem("seal_token");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

    throw new Error(message);
  }

  return data as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse<T>(response);
}

export function toCurrentUser(user: {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  roles?: string[];
  role?: string;
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
  };
}

export function saveAuthSession(
  payload: {
    token: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      roles: string[];
    };
  },
  remember: boolean,
) {
  const currentUser = toCurrentUser(payload.user);
  const tokenStorage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  tokenStorage.setItem("seal_token", payload.token);
  otherStorage.removeItem("seal_token");
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  window.dispatchEvent(new Event("storage"));

  return currentUser;
}

export function clearAuthSession() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("seal_token");
  sessionStorage.removeItem("seal_token");
  window.dispatchEvent(new Event("storage"));
}
