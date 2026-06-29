"use client";
import PocketBase from "pocketbase";

export const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? "http://127.0.0.1:8090";

let _pb: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (_pb) return _pb;
  _pb = new PocketBase(PB_URL);
  _pb.autoCancellation(false);
  return _pb;
}
