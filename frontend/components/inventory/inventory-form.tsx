"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createInventoryItem,
  updateInventoryItem,
} from "@/hooks/useInventory";
import type { InventoryItem, InventoryUnit, InventoryLocation } from "@/lib/types";
import { Loader2 } from "lucide-react";

const UNITS: InventoryUnit[] = ["pieces", "lbs", "kg", "sqft", "sqm"];
const LOCATIONS: InventoryLocation[] = ["warehouse", "job_site", "in_transit"];

const schema = z.object({
  itemName: z.string().min(1, "Item name is required").max(200),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 0,
      "Quantity must be a non-negative number",
    ),
  unit: z.enum(["pieces", "lbs", "kg", "sqft", "sqm"]),
  location: z.enum(["warehouse", "job_site", "in_transit"]),
  costPerUnit: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Cost must be a non-negative number",
    ),
  lastUpdated: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function InventoryForm({
  projectId,
  item,
  onSaved,
}: {
  projectId: string;
  item?: InventoryItem;
  onSaved?: (i: InventoryItem) => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { register, handleSubmit, formState, setValue, watch } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        itemName: item?.itemName ?? "",
        quantity: item ? String(item.quantity) : "0",
        unit: item?.unit ?? "pieces",
        location: item?.location ?? "warehouse",
        costPerUnit: item?.costPerUnit != null ? String(item.costPerUnit) : "",
        lastUpdated: item?.lastUpdated ?? "",
      },
    });
  const unit = watch("unit");
  const location = watch("location");

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    try {
      const saved = item
        ? await updateInventoryItem(item.id, {
            itemName: values.itemName,
            quantity: Number(values.quantity),
            unit: values.unit,
            location: values.location,
            costPerUnit: values.costPerUnit
              ? Number(values.costPerUnit)
              : null,
            lastUpdated: values.lastUpdated || undefined,
          })
        : await createInventoryItem({
            projectId,
            itemName: values.itemName,
            quantity: Number(values.quantity),
            unit: values.unit,
            location: values.location,
            costPerUnit: values.costPerUnit
              ? Number(values.costPerUnit)
              : null,
            lastUpdated: values.lastUpdated || undefined,
          });
      onSaved?.(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="itemName">Item name</Label>
        <Input id="itemName" {...register("itemName")} />
        {formState.errors.itemName && (
          <p className="text-xs text-destructive">
            {formState.errors.itemName.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            inputMode="decimal"
            {...register("quantity")}
          />
          {formState.errors.quantity && (
            <p className="text-xs text-destructive">
              {formState.errors.quantity.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={unit}
            onValueChange={(v) => setValue("unit", v as InventoryUnit)}
          >
            <SelectTrigger id="unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costPerUnit">Cost / unit (USD)</Label>
          <Input
            id="costPerUnit"
            inputMode="decimal"
            {...register("costPerUnit")}
          />
          {formState.errors.costPerUnit && (
            <p className="text-xs text-destructive">
              {formState.errors.costPerUnit.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Select
            value={location}
            onValueChange={(v) => setValue("location", v as InventoryLocation)}
          >
            <SelectTrigger id="location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastUpdated">Last updated</Label>
          <Input id="lastUpdated" type="date" {...register("lastUpdated")} />
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {item ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
