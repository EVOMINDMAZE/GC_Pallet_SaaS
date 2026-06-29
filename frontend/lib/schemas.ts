import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  address: z.string().max(500).optional().or(z.literal("")),
  budget: z.coerce.number().nonnegative("Must be ≥ 0").optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  status: z.enum(["planning", "active", "completed", "on_hold"]),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const inventorySchema = z.object({
  item_name: z.string().min(1).max(200),
  quantity: z.coerce.number().nonnegative(),
  unit: z.enum(["pieces", "lbs", "kg", "sqft", "sqm"]),
  location: z.enum(["warehouse", "job_site", "in_transit"]),
  cost_per_unit: z.union([z.coerce.number().nonnegative(), z.literal(""), z.undefined()]).optional(),
  project: z.string().min(1, "Pick a project"),
});
export type InventoryInput = z.infer<typeof inventorySchema>;

export const documentMetaSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(["contract", "permit", "invoice", "receipt", "photo", "other"]),
  project: z.string().min(1, "Pick a project"),
});
export const documentSchema = documentMetaSchema.extend({
  file: z.instanceof(File, { message: "File is required" }),
});
export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
