/**
 * Domain types re-exported for the rest of the app. We keep them
 * separate from the raw Database type so the UI can depend on a
 * stable shape independent of column-level changes.
 */
import type {
  ProjectStatus,
  DocumentCategory,
  InventoryUnit,
  InventoryLocation,
} from "./supabase/types";

export type {
  ProjectStatus,
  DocumentCategory,
  InventoryUnit,
  InventoryLocation,
};

export interface Profile {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  address: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  projectId: string;
  itemName: string;
  quantity: number;
  unit: InventoryUnit;
  location: InventoryLocation;
  costPerUnit: number | null;
  /** Row's real last-edit timestamp (auto-bumped by trigger). Drives the
   *  list's "Last updated" column. Full ISO 8601 string. */
  lastUpdated: string;
  /** The "date verified" form field — written to the `last_updated date`
   *  column. Empty string if the user hasn't set one. Date-only string
   *  (e.g. "2026-07-01"). */
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  category: DocumentCategory;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  /** A short-lived signed URL for downloading the file. Populated by the
   *  documents list hook so the UI doesn't have to await another call. */
  downloadUrl?: string;
}

export interface Share {
  id: string;
  token: string;
  resourceId: string;
  createdBy: string;
  expiresAt: string | null;
  revoked: boolean;
  viewCount: number;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicShareView {
  /** Whether the token is still resolvable to a live project. */
  ok: boolean;
  reason?: "not_found" | "revoked" | "expired";
  project?: {
    id: string;
    name: string;
    address: string | null;
    status: ProjectStatus;
  };
  owner?: { name: string };
  documents?: Array<{
    id: string;
    name: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    downloadUrl: string;
  }>;
  share?: { label: string | null; expiresAt: string | null };
}

/**
 * Backwards-compat aliases for the old PocketBase-era record types
 * some dashboard components still import by name.
 */
export type ProjectsRecord = Project;
export type ShareRecord = Share;
export type InventoryRecord = InventoryItem;
export type DocumentRecord = ProjectDocument;
