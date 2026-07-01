// Mirrors the `public.*` tables in supabase/schema.sql. Keep these
// in sync if you add columns. Used by hooks and components for typing.

export type ProjectStatus =
  | "planning"
  | "active"
  | "completed"
  | "on_hold"
  | "draft"
  | "procurement";

export type DocumentCategory =
  | "contract"
  | "permit"
  | "invoice"
  | "receipt"
  | "photo"
  | "other";

export type InventoryUnit = "pieces" | "lbs" | "kg" | "sqft" | "sqm";
export type InventoryLocation = "warehouse" | "job_site" | "in_transit";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type InventoryItem = {
  id: string;
  user_id: string;
  project_id: string;
  item_name: string;
  quantity: number;
  unit: InventoryUnit;
  location: InventoryLocation;
  cost_per_unit: number | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
};

export type DocumentRecord = {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  category: DocumentCategory;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Share = {
  id: string;
  token: string;
  resource_id: string;
  created_by: string;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
  label: string | null;
  created_at: string;
  updated_at: string;
};

// Back-compat aliases for old code that referenced PB-shaped types.
export type ProjectsRecord = Project;
export type InventoryRecord = InventoryItem;
export type DocumentsRecord = DocumentRecord;
export type UsersRecord = Profile;
