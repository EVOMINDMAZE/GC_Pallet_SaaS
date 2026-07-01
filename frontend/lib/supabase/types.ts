/**
 * Hand-rolled Database type matching the SQL in
 * `supabase/migrations/20260101000000_init.sql`. Mirrors the schema 1:1
 * so supabase-js gives us typed `.from('projects').select()` etc.
 *
 * Keep this in sync with the migration file. When you change a column
 * or add a table, update both.
 *
 * The shape follows postgrest-js's GenericSchema. Relationships is
 * declared as an empty tuple `[]` (not `Array<never>`) so the
 * inference for `.from(...).select()` doesn't collapse to `never`.
 */

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

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

interface ProfilesTable {
  Row: {
    id: string;
    name: string;
    company_name: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    name: string;
    company_name?: string | null;
    phone?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    company_name?: string | null;
    phone?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}
interface ProjectsTable {
  Row: {
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
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    address?: string | null;
    budget?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    status: ProjectStatus;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    name?: string;
    address?: string | null;
    budget?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: ProjectStatus;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}
interface InventoryTable {
  Row: {
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
  Insert: {
    id?: string;
    user_id: string;
    project_id: string;
    item_name: string;
    quantity: number;
    unit: InventoryUnit;
    location: InventoryLocation;
    cost_per_unit?: number | null;
    last_updated?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    project_id?: string;
    item_name?: string;
    quantity?: number;
    unit?: InventoryUnit;
    location?: InventoryLocation;
    cost_per_unit?: number | null;
    last_updated?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}
interface DocumentsTable {
  Row: {
    id: string;
    user_id: string;
    project_id: string;
    name: string;
    category: DocumentCategory;
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_at: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    project_id: string;
    name: string;
    category: DocumentCategory;
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    project_id?: string;
    name?: string;
    category?: DocumentCategory;
    storage_path?: string;
    file_name?: string;
    mime_type?: string;
    size_bytes?: number;
    uploaded_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}
interface SharesTable {
  Row: {
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
  Insert: {
    id?: string;
    token: string;
    resource_id: string;
    created_by: string;
    expires_at?: string | null;
    revoked?: boolean;
    view_count?: number;
    label?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    token?: string;
    resource_id?: string;
    created_by?: string;
    expires_at?: string | null;
    revoked?: boolean;
    view_count?: number;
    label?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}
interface ContactMessagesTable {
  Row: {
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    email: string;
    message: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    email?: string;
    message?: string;
    created_at?: string;
  };
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: ProfilesTable;
      projects: ProjectsTable;
      inventory: InventoryTable;
      documents: DocumentsTable;
      shares: SharesTable;
      contact_messages: ContactMessagesTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
