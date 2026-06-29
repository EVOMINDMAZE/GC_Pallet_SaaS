export type ProjectStatus = "planning" | "active" | "completed" | "on_hold";
export type DocumentCategory = "contract" | "permit" | "invoice" | "receipt" | "photo" | "other";
export type InventoryUnit = "pieces" | "lbs" | "kg" | "sqft" | "sqm";
export type InventoryLocation = "warehouse" | "job_site" | "in_transit";

export type ProjectsRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  address?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  user: string;
  created: string;
  updated: string;
};

export type DocumentsRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  file: string;
  category: DocumentCategory;
  project: string;
  uploaded_at: string;
  user: string;
  created: string;
  updated: string;
};

export type InventoryRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  item_name: string;
  quantity: number;
  unit: InventoryUnit;
  location: InventoryLocation;
  cost_per_unit?: number;
  project: string;
  last_updated: string;
  user: string;
  created: string;
  updated: string;
};

export type UsersRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  email: string;
  name?: string;
  avatar?: string;
  company_name?: string;
  phone?: string;
  verified: boolean;
  created: string;
  updated: string;
};
