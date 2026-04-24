import type {
  Token,
  LoginRequest,
  MicrosoftLoginResponse,
  User,
  UserCreate,
  UserUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  MeetingHost,
  MeetingHostCreate,
  MeetingHostUpdate,
  MeetingLink,
  MeetingLinkCreate,
  MeetingLinkUpdate,
  SyncLog,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.0.230:8000";
const API = `${BASE_URL}/api/v1`;

// ─── Token helpers ────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setTokens(token: Token): void {
  localStorage.setItem("access_token", token.access_token);
  localStorage.setItem("refresh_token", token.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

let refreshingPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data: Token = await res.json();
    setTokens(data);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401 && !isRetry) {
    if (!refreshingPromise) {
      refreshingPromise = doRefresh().finally(() => {
        refreshingPromise = null;
      });
    }
    const refreshed = await refreshingPromise;
    if (refreshed) {
      return request<T>(path, options, true);
    }
    // Refresh failed — navigate to login
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(credentials: LoginRequest): Promise<Token> {
  return request<Token>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function getMicrosoftLoginUrl(): Promise<MicrosoftLoginResponse> {
  return request<MicrosoftLoginResponse>("/auth/microsoft/login");
}

export async function microsoftCallback(
  code: string,
  state: string,
): Promise<Token> {
  return request<Token>("/auth/microsoft/callback", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(
  includeInactive = false,
): Promise<Category[]> {
  return request<Category[]>(`/categories?include_inactive=${includeInactive}`);
}

export async function createCategory(data: CategoryCreate): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: number,
  data: CategoryUpdate,
): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  return request<void>(`/categories/${id}`, { method: "DELETE" });
}

// ─── Hosts ────────────────────────────────────────────────────────────────────

export async function getHosts(
  includeInactive = false,
): Promise<MeetingHost[]> {
  return request<MeetingHost[]>(`/hosts?include_inactive=${includeInactive}`);
}

export async function createHost(
  data: MeetingHostCreate,
): Promise<MeetingHost> {
  return request<MeetingHost>("/hosts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHost(
  id: number,
  data: MeetingHostUpdate,
): Promise<MeetingHost> {
  return request<MeetingHost>(`/hosts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteHost(id: number): Promise<void> {
  return request<void>(`/hosts/${id}`, { method: "DELETE" });
}

export async function uploadHostImage(
  id: number,
  file: File,
): Promise<MeetingHost> {
  const form = new FormData();
  form.append("file", file);
  return request<MeetingHost>(`/hosts/${id}/image`, {
    method: "POST",
    body: form,
  });
}

export async function deleteHostImage(id: number): Promise<MeetingHost> {
  return request<MeetingHost>(`/hosts/${id}/image`, { method: "DELETE" });
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export interface MeetingFilters {
  category_id?: number;
  host_id?: number;
  search?: string;
  include_inactive?: boolean;
  skip?: number;
  limit?: number;
}

export async function getMeetings(
  filters: MeetingFilters = {},
): Promise<MeetingLink[]> {
  const params = new URLSearchParams();
  if (filters.category_id != null)
    params.set("category_id", String(filters.category_id));
  if (filters.host_id != null) params.set("host_id", String(filters.host_id));
  if (filters.search) params.set("search", filters.search);
  if (filters.include_inactive) params.set("include_inactive", "true");
  if (filters.skip != null) params.set("skip", String(filters.skip));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return request<MeetingLink[]>(`/meetings${qs ? `?${qs}` : ""}`);
}

export async function getMeeting(id: number): Promise<MeetingLink> {
  return request<MeetingLink>(`/meetings/${id}`);
}

export async function createMeeting(data: MeetingLinkCreate): Promise<MeetingLink> {
  return request<MeetingLink>("/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMeeting(
  id: number,
  data: MeetingLinkUpdate,
): Promise<MeetingLink> {
  return request<MeetingLink>(`/meetings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadMeetingImage(
  id: number,
  file: File,
): Promise<MeetingLink> {
  const form = new FormData();
  form.append("file", file);
  return request<MeetingLink>(`/meetings/${id}/image`, {
    method: "POST",
    body: form,
  });
}

export async function deleteMeetingImage(id: number): Promise<MeetingLink> {
  return request<MeetingLink>(`/meetings/${id}/image`, { method: "DELETE" });
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function triggerSync(): Promise<SyncLog> {
  return request<SyncLog>("/meetings/sync", { method: "POST" });
}

export async function getSyncLogs(skip = 0, limit = 50): Promise<SyncLog[]> {
  return request<SyncLog[]>(`/meetings/sync/logs?skip=${skip}&limit=${limit}`);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(skip = 0, limit = 100): Promise<User[]> {
  return request<User[]>(`/users?skip=${skip}&limit=${limit}`);
}

export async function createUser(data: UserCreate): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: UserUpdate): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  return request<void>(`/users/${id}`, { method: "DELETE" });
}

// ─── Static asset URL helper ──────────────────────────────────────────────────

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}/${path.replace(/^\//, "")}`;
}
