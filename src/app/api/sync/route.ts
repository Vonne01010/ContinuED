import { NextResponse } from "next/server";
import { persist, store, type StudentRecord, type SyncedItem } from "@/lib/serverStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, lo = 0, hi = 1e6) => Math.max(lo, Math.min(hi, Number(v) || 0));

/** Receive queued progress from a student device. Idempotent per item id. */
export async function POST(req: Request) {
  let b: { studentId?: string; name?: string; xp?: number; streak?: number; avgProgress?: number; items?: SyncedItem[] };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = str(b.studentId, 64);
  if (!id || !Array.isArray(b.items)) return NextResponse.json({ error: "studentId and items required" }, { status: 400 });

  const s = store();
  const rec: StudentRecord = s.students[id] ?? { id, name: "Student", xp: 0, streak: 0, avgProgress: 0, lastSync: "", items: [] };
  const known = new Set(rec.items.map((i) => i.id));
  const accepted: string[] = [];
  for (const i of b.items.slice(0, 100)) {
    const itemId = str(i.id, 64);
    if (!itemId) continue;
    if (!known.has(itemId)) {
      rec.items.unshift({
        id: itemId,
        kind: i.kind === "lesson" ? "lesson" : i.kind === "game" ? "game" : "quiz",
        subject: str(i.subject, 30) || undefined,
        label: str(i.label, 160),
        xp: num(i.xp, 0, 1000),
        correct: i.correct === undefined ? undefined : num(i.correct, 0, 100),
        total: i.total === undefined ? undefined : num(i.total, 0, 100),
        at: str(i.at, 40),
      });
    }
    accepted.push(itemId);
  }
  rec.items = rec.items.slice(0, 200);
  rec.name = str(b.name, 40) || rec.name;
  rec.xp = num(b.xp);
  rec.streak = num(b.streak, 0, 10000);
  rec.avgProgress = num(b.avgProgress, 0, 100);
  rec.lastSync = new Date().toISOString();
  s.students[id] = rec;
  persist();
  return NextResponse.json({ accepted, syncedAt: rec.lastSync });
}

/** Teacher dashboard: what the school server has received. */
export async function GET() {
  const s = store();
  const students = Object.values(s.students).map(({ items, ...rest }) => ({ ...rest, results: items.length }));
  const results = Object.values(s.students)
    .flatMap((st) => st.items.map((i) => ({ ...i, student: st.name })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);
  const packages = s.packages.map((p) => ({ id: p.id, version: p.version, createdAt: p.createdAt, sizeMB: p.sizeMB, bytes: p.bytes, lessons: p.items.length }));
  return NextResponse.json({ students, results, packages });
}
