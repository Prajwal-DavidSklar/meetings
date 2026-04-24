// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MicrosoftLoginResponse {
  auth_url: string;
  state: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  microsoft_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  name: string;
  role?: UserRole;
  password?: string;
}

export interface UserUpdate {
  name?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  color?: string;
  sort_order?: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ─── MeetingHost ──────────────────────────────────────────────────────────────

export interface MeetingHost {
  id: number;
  name: string;
  display_name: string | null;
  email: string | null;
  hubspot_owner_id: string | null;
  is_custom: boolean;
  is_active: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingHostCreate {
  name: string;
  display_name?: string;
  email?: string;
}

export interface MeetingHostUpdate {
  name?: string;
  display_name?: string;
  email?: string;
  is_active?: boolean;
}

// ─── MeetingLink ──────────────────────────────────────────────────────────────

export interface MeetingLink {
  id: number;
  hubspot_link_id: string | null;
  name: string;
  url: string;
  slug: string | null;
  link_type: string | null;
  display_name: string | null;
  category_id: number | null;
  host_id: number | null;
  host_override_locked: boolean;
  image_path: string | null;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
  host: MeetingHost | null;
}

export interface MeetingLinkCreate {
  name: string;
  url: string;
  display_name?: string;
  category_id?: number | null;
  host_id?: number | null;
  sort_order?: number;
  notes?: string;
}

export interface MeetingLinkUpdate {
  display_name?: string;
  category_id?: number | null;
  host_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
  notes?: string;
  unlock_host_override?: boolean;
}

// ─── SyncLog ──────────────────────────────────────────────────────────────────

export type SyncStatus = "running" | "success" | "failed";

export interface SyncLog {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: SyncStatus;
  links_added: number;
  links_updated: number;
  links_deactivated: number;
  error_message: string | null;
  triggered_by_id: number | null;
}
