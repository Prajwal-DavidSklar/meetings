export interface User {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "user";
  is_active: boolean;
  microsoft_id: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface MeetingHost {
  id: number;
  name: string;
  display_name: string | null;
  email: string | null;
  hubspot_owner_id: string | null;
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingLink {
  id: number;
  hubspot_link_id: string | null;
  name: string;
  display_name: string | null;
  url: string;
  slug: string | null;
  link_type: string | null;
  category_id: number | null;
  host_id: number | null;
  host_override_locked: boolean;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
  host: MeetingHost | null;
}

export interface SyncLog {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: string;
  links_added: number;
  links_updated: number;
  links_deactivated: number;
  error_message: string | null;
  triggered_by_id: number | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface MeetingLinkUpdate {
  display_name?: string | null;
  category_id?: number | null;
  host_id?: number | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  unlock_host_override?: boolean | null;
}

export interface CategoryCreate {
  name: string;
  description?: string | null;
  color?: string | null;
  sort_order?: number;
}

export interface CategoryUpdate {
  name?: string | null;
  description?: string | null;
  color?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}

export interface MeetingHostCreate {
  name: string;
  display_name?: string | null;
  email?: string | null;
}

export interface MeetingHostUpdate {
  name?: string | null;
  display_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
}

export interface UserCreate {
  email: string;
  name?: string | null;
  role: "admin" | "user";
  password?: string | null;
}

export interface UserUpdate {
  name?: string | null;
  role?: "admin" | "user" | null;
  is_active?: boolean | null;
  password?: string | null;
}
