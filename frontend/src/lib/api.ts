import type {
  Token,
  User,
  Category,
  CategoryCreate,
  CategoryUpdate,
  MeetingHost,
  MeetingHostCreate,
  MeetingHostUpdate,
  MeetingLink,
  MeetingLinkUpdate,
  SyncLog,
  UserCreate,
  UserUpdate,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.0.230:8000/api/v1";
export const UPLOADS_BASE =
  process.env.NEXT_PUBLIC_UPLOADS_URL ?? "https://192.168.0.230:8000";

// ─── Token storage ─────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  getRefresh: () =>
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null,
  set: (tokens: Token) => {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// ─── Core fetch with auto-refresh ──────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }
    const data: Token = await res.json();
    tokenStorage.set(data);
    return data.access_token;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let token = tokenStorage.getAccess();
  let res = await makeRequest(token);

  if (res.status === 401) {
    // Try to refresh once
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      token = newToken;
    } else {
      token = await new Promise((resolve) => refreshQueue.push(resolve));
    }

    if (!token) {
      tokenStorage.clear();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expired");
    }

    res = await makeRequest(token);
  }

  if (!res.ok) {
    let detail = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<Token>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMicrosoftLoginUrl: () =>
    apiFetch<{ auth_url: string; state: string }>("/auth/microsoft/login"),

  microsoftCallback: (code: string, state: string) =>
    apiFetch<Token>("/auth/microsoft/callback", {
      method: "POST",
      body: JSON.stringify({ code, state }),
    }),

  me: () => apiFetch<User>("/auth/me"),
};

// ─── Categories ─────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: (includeInactive = false) =>
    apiFetch<Category[]>(`/categories/?include_inactive=${includeInactive}`),

  create: (data: CategoryCreate) =>
    apiFetch<Category>("/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: CategoryUpdate) =>
    apiFetch<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ─── Hosts ───────────────────────────────────────────────────────────────────

export const hostsApi = {
  list: (includeInactive = false) =>
    apiFetch<MeetingHost[]>(`/hosts/?include_inactive=${includeInactive}`),

  create: (data: MeetingHostCreate) =>
    apiFetch<MeetingHost>("/hosts/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: MeetingHostUpdate) =>
    apiFetch<MeetingHost>(`/hosts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) => apiFetch<void>(`/hosts/${id}`, { method: "DELETE" }),
};

// ─── Meetings ────────────────────────────────────────────────────────────────

export interface MeetingFilters {
  category_id?: number;
  host_id?: number;
  search?: string;
  include_inactive?: boolean;
}

export const meetingsApi = {
  list: (filters: MeetingFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category_id != null)
      params.set("category_id", String(filters.category_id));
    if (filters.host_id != null) params.set("host_id", String(filters.host_id));
    if (filters.search) params.set("search", filters.search);
    if (filters.include_inactive) params.set("include_inactive", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<MeetingLink[]>(`/meetings/${qs}`);
  },

  get: (id: number) => apiFetch<MeetingLink>(`/meetings/${id}`),

  update: (id: number, data: MeetingLinkUpdate) =>
    apiFetch<MeetingLink>(`/meetings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<MeetingLink>(`/meetings/${id}/image`, {
      method: "POST",
      body: form,
    });
  },

  deleteImage: (id: number) =>
    apiFetch<MeetingLink>(`/meetings/${id}/image`, { method: "DELETE" }),

  sync: () => apiFetch<SyncLog>("/meetings/sync", { method: "POST" }),

  syncLogs: () => apiFetch<SyncLog[]>("/meetings/sync/logs"),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => apiFetch<User[]>("/users/"),

  create: (data: UserCreate) =>
    apiFetch<User>("/users/", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UserUpdate) =>
    apiFetch<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
};
