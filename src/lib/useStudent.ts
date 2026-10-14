"use client";
import { useStored } from "./useStored";
import { SAMPLE_PACKAGE } from "./data";
import type { PackageItem, PendingItem, Pkg, StudentState } from "./types";

export const today = () => new Date().toLocaleDateString("en-CA");
export const XP_PER_LEVEL = 200;
export const levelOf = (xp: number) => ({ level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL });

const initialState = (): StudentState => ({
  xp: 320,
  streak: 3,
  lastDay: "",
  progress: Object.fromEntries(SAMPLE_PACKAGE.items.slice(0, 3).map((it, i) => [it.lesson, i < 2 ? 100 : 40])),
  minutesToday: 12,
  minutesDay: "",
  badges: ["First Steps"],
  quizBest: 0,
});

/** Roll the daily counters over when the date changes. */
function normalize(st: StudentState): StudentState {
  return st.minutesDay === today() ? st : { ...st, minutesDay: today(), minutesToday: st.minutesDay === "" ? st.minutesToday : 0 };
}

/** Student progress (XP, streak, per-lesson %, badges), persisted in localStorage. */
export function useStudent() {
  const [raw, setS] = useStored<StudentState>("continued.student", initialState);
  const s = normalize(raw);

  const update = (fn: (p: StudentState) => StudentState) =>
    setS((p) => {
      const n = normalize(p);
      const out = fn(n);
      return out.lastDay === today() ? out : { ...out, streak: out.streak + 1, lastDay: today() };
    });
  const addXp = (n: number) => update((p) => ({ ...p, xp: p.xp + n }));
  const addMinutes = (m: number) => update((p) => ({ ...p, minutesToday: p.minutesToday + m }));
  const setProgress = (lesson: string, pct: number) => update((p) => ({ ...p, progress: { ...p.progress, [lesson]: pct } }));
  const addBadge = (b: string) => update((p) => (p.badges.includes(b) ? p : { ...p, badges: [...p.badges, b] }));
  const recordQuiz = (score: number) => update((p) => ({ ...p, quizBest: Math.max(p.quizBest, score) }));

  return { s, addXp, addMinutes, setProgress, addBadge, recordQuiz, update };
}

/** The package the teacher built (localStorage), or the bundled sample package. */
export function usePackage(): { pkg: Pkg; fromTeacher: boolean } {
  const [pkg] = useStored<Pkg | null>("continued.currentPackage", null);
  return { pkg: pkg && pkg.items?.length ? pkg : SAMPLE_PACKAGE, fromTeacher: !!(pkg && pkg.items?.length) };
}

/** Local queue of progress waiting to sync, plus a simulated sync-to-cloud action. */
export function useSyncQueue() {
  const [queue, setQueue] = useStored<PendingItem[]>("continued.pending", []);
  const [lastSync, setLastSync] = useStored<string | null>("continued.lastSync", null);
  const waiting = queue.filter((q) => q.status !== "synced").length;

  const enqueue = (item: Omit<PendingItem, "id" | "at" | "status">) =>
    setQueue((q) => [{ ...item, id: `${Date.now()}`, at: new Date().toISOString(), status: "pending" as const }, ...q].slice(0, 30));

  /** Simulated: no data leaves the device. */
  const syncNow = () => {
    setQueue((q) => q.map((x) => (x.status === "pending" ? { ...x, status: "syncing" } : x)));
    setTimeout(() => {
      setQueue((q) => q.map((x) => (x.status === "syncing" ? { ...x, status: "synced" } : x)));
      setLastSync(new Date().toISOString());
    }, 1400);
  };
  const syncing = queue.some((q) => q.status === "syncing");
  return { queue, waiting, syncing, lastSync, enqueue, syncNow };
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
