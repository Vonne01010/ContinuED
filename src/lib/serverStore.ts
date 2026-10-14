import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Pkg } from "./types";

/**
 * Tiny server-side store standing in for the school server / cloud.
 * Held in memory and mirrored to a temp file so `next start` restarts keep data.
 * On serverless hosts (Vercel) this is per-instance and ephemeral: swap for a real database in production.
 */
export type SyncedItem = { id: string; kind: "quiz" | "lesson" | "game"; subject?: string; label: string; xp: number; correct?: number; total?: number; at: string };
export type StudentRecord = { id: string; name: string; xp: number; streak: number; avgProgress: number; lastSync: string; items: SyncedItem[] };
type Store = { packages: Pkg[]; students: Record<string, StudentRecord> };

const FILE = path.join(os.tmpdir(), "continued-store.json");
const g = globalThis as unknown as { __continued?: Store };

function load(): Store {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Store;
  } catch {
    return { packages: [], students: {} };
  }
}

export function store(): Store {
  return (g.__continued ??= load());
}

export function persist() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(store()));
  } catch {
    /* read-only filesystem: stay in memory */
  }
}
