"use client";
import { useStored, lsGet, lsSet } from "./useStored";
import { SAMPLE_PACKAGE } from "./data";
import { STUDENT } from "./config";
import type { PackageItem, PendingItem, Pkg, StudentState } from "./types";

export const today = () => new Date().toLocaleDateString("en-CA");
export const XP_PER_LEVEL = 200;
export const levelOf = (xp: number) => ({ level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL });

const K = { student: "continued.student", pkg: "continued.currentPackage", queue: "continued.pending", lastSync: "continued.lastSync", id: "continued.studentId" };

const initialState = (): StudentState => ({
  xp: 320,
  streak: 3,
  lastDay: "",
  progress: Object.fromEntries(SAMPLE_PACKAGE.items.slice(0, 3).map((it, i) => [it.lesson, i < 2 ? 100 : 40])),
  minutesToday: 12,
  minutesDay: "",
  badges: ["First Steps"],
  quizBest: {},
});

/** Roll the daily counters over when the date changes; migrate older saved shapes. */
function normalize(st: StudentState): StudentState {
  const quizBest = st.quizBest && typeof st.quizBest === "object" ? st.quizBest : {};
  const base = { ...st, quizBest };
  return st.minutesDay === today() ? base : { ...base, minutesDay: today(), minutesToday: st.minutesDay === "" ? st.minutesToday : 0 };
}

/** Student progress (XP, streak, per-lesson %, badges), persisted in localStorage. */
export function useStudent() {
  const [raw, setS] = useStored<StudentState>(K.student, initialState);
  const s = normalize(raw);

  const update = (fn: (p: StudentState) => StudentState) =>
    setS((p) => {
      const out = fn(normalize(p));
      return out.lastDay === today() ? out : { ...out, streak: out.streak + 1, lastDay: today() };
    });
  const addXp = (n: number) => update((p) => ({ ...p, xp: p.xp + n }));
  const addMinutes = (m: number) => update((p) => ({ ...p, minutesToday: p.minutesToday + m }));
  const setProgress = (lesson: string, pct: number) => update((p) => ({ ...p, progress: { ...p.progress, [lesson]: pct } }));
  const addBadge = (b: string) => update((p) => (p.badges.includes(b) ? p : { ...p, badges: [...p.badges, b] }));
  const recordQuiz = (subject: string, accuracy: number) => update((p) => ({ ...p, quizBest: { ...p.quizBest, [subject]: Math.max(p.quizBest[subject] ?? 0, accuracy) } }));

  return { s, addXp, addMinutes, setProgress, addBadge, recordQuiz, update };
}

/** The package the teacher built (downloaded from the school server), or the bundled sample package. */
export function usePackage(): { pkg: Pkg; fromTeacher: boolean } {
  const [pkg] = useStored<Pkg | null>(K.pkg, null);
  return { pkg: pkg && pkg.items?.length ? pkg : SAMPLE_PACKAGE, fromTeacher: !!(pkg && pkg.items?.length) };
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function enqueueSync(item: Omit<PendingItem, "id" | "at" | "status">) {
  lsSet<PendingItem[]>(K.queue, (q) => [{ ...item, id: newId(), at: new Date().toISOString(), status: "pending" as const }, ...(q ?? [])].slice(0, 50));
  if (typeof navigator !== "undefined" && navigator.onLine) setTimeout(() => void runSync(), 800); // sync right away when connected
}

let inflight = false;

/** Really sends queued progress to /api/sync. Needs a connection; failed items go back to "pending". */
export async function runSync(): Promise<{ ok: boolean; message?: string }> {
  if (inflight) return { ok: false, message: "Already syncing" };
  if (!navigator.onLine) return { ok: false, message: "No internet connection" };
  const todo = lsGet<PendingItem[]>(K.queue, []).filter((x) => x.status !== "synced");
  if (!todo.length) return { ok: true };
  inflight = true;
  const ids = new Set(todo.map((t) => t.id));
  lsSet<PendingItem[]>(K.queue, (q) => (q ?? []).map((x) => (ids.has(x.id) ? { ...x, status: "syncing" as const, error: undefined } : x)));
  try {
    const st = normalize(lsGet<StudentState>(K.student, initialState()));
    const pkg = lsGet<Pkg | null>(K.pkg, null) ?? SAMPLE_PACKAGE;
    const avg = pkg.items.length ? Math.round(pkg.items.reduce((a, i) => a + (st.progress[i.lesson] ?? 0), 0) / pkg.items.length) : 0;
    let studentId = lsGet<string>(K.id, "");
    if (!studentId) {
      studentId = newId();
      lsSet(K.id, studentId);
    }
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        name: STUDENT.name,
        xp: st.xp,
        streak: st.streak,
        avgProgress: avg,
        items: todo.map(({ id, kind, subject, label, xp, correct, total, at }) => ({ id, kind, subject, label, xp, correct, total, at })),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const data: { accepted: string[]; syncedAt: string } = await res.json();
    const ok = new Set(data.accepted);
    lsSet<PendingItem[]>(K.queue, (q) => (q ?? []).map((x) => (ok.has(x.id) ? { ...x, status: "synced" as const } : x)));
    lsSet(K.lastSync, data.syncedAt);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    lsSet<PendingItem[]>(K.queue, (q) => (q ?? []).map((x) => (ids.has(x.id) && x.status === "syncing" ? { ...x, status: "pending" as const, error: message } : x)));
    return { ok: false, message };
  } finally {
    inflight = false;
  }
}

/** Download the newest package from the school server if it is newer than the one on this device. */
export async function checkForPackage(): Promise<Pkg | null> {
  if (!navigator.onLine) return null;
  try {
    const res = await fetch("/api/packages", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const { package: remote }: { package: Pkg | null } = await res.json();
    const local = lsGet<Pkg | null>(K.pkg, null);
    if (remote && remote.items?.length && (!local || remote.createdAt > local.createdAt)) {
      lsSet(K.pkg, remote);
      return remote;
    }
  } catch {
    /* offline or server unreachable: keep what we have */
  }
  return null;
}

export function useSyncQueue() {
  const [queue] = useStored<PendingItem[]>(K.queue, []);
  const [lastSync] = useStored<string | null>(K.lastSync, null);
  const waiting = queue.filter((q) => q.status !== "synced").length;
  const syncing = queue.some((q) => q.status === "syncing");
  const failed = queue.find((q) => q.status === "pending" && q.error)?.error;
  return { queue, waiting, syncing, failed, lastSync, enqueue: enqueueSync, syncNow: runSync };
}

export type LessonStatus = "done" | "progress" | "next";
export function lessonStatuses(items: PackageItem[], progress: Record<string, number>) {
  const firstOpen = items.findIndex((it) => (progress[it.lesson] ?? 0) < 100);
  return items.map((it, i) => {
    const pct = progress[it.lesson] ?? 0;
    const status: LessonStatus = pct >= 100 ? "done" : i === firstOpen ? "progress" : "next";
    return { ...it, pct, status };
  });
}
