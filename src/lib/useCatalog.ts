"use client";
import { CATALOG } from "./data";
import { useStored } from "./useStored";
import type { CatalogItem } from "./types";

/** Bundled catalog plus resources the teacher added from outside (search or URL import). */
export function useCatalog() {
  const [custom, setCustom] = useStored<CatalogItem[]>("continued.customResources", []);
  const catalog = [...CATALOG, ...custom];
  const add = (items: CatalogItem[]) =>
    setCustom((prev) => [...prev, ...items.filter((i) => !prev.some((p) => p.id === i.id))]);
  const remove = (id: string) => setCustom((prev) => prev.filter((p) => p.id !== id));
  return { catalog, custom, add, remove };
}
