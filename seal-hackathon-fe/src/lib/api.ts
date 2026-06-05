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
  phoneNumber?: string | null;
  studentCode?: string | null;
  schoolName?: string | null;
  studentType?: string | null;
};

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
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
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
  phoneNumber?: string | null;
  studentCode?: string | null;
  schoolName?: string | null;
  studentType?: string | null;
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
  };
}

export function saveAuthSession(
  payload: {
    user: {
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
    };
  },
  remember: boolean,
) {
  const currentUser = toCurrentUser(payload.user);
  const uiStorage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  uiStorage.setItem("currentUser", JSON.stringify(currentUser));
  otherStorage.removeItem("currentUser");
  window.dispatchEvent(new Event("storage"));

  return currentUser;
}

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
  }>("/Auth/me");

  const currentUser = toCurrentUser(user);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  sessionStorage.removeItem("currentUser");
  window.dispatchEvent(new Event("storage"));

  return currentUser;
}

export async function clearAuthSession() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.dispatchEvent(new Event("storage"));

  try {
    await apiRequest("/Auth/logout", { method: "POST", auth: false });
  } catch {
    // Local UI state is already cleared; logout may be unavailable on older backends.
  }
}
