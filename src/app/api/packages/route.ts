import { NextResponse } from "next/server";
import { sectionsFor } from "@/lib/data";
import { persist, store } from "@/lib/serverStore";
import type { PackageItem, Pkg } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.slice(0, max) : "");

/** School server: accept a package from the teacher and attach offline lesson content to each item. */
export async function POST(req: Request) {
  let body: { items?: PackageItem[]; version?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 60) {
    return NextResponse.json({ error: "A package needs 1-60 lessons" }, { status: 400 });
  }

  const items: PackageItem[] = body.items.map((i) => {
    const base = {
      lesson: str(i.lesson, 200),
      source: str(i.source, 80),
      resourceId: str(i.resourceId, 80),
      title: str(i.title, 200),
      topic: str(i.topic, 80),
      url: /^https?:\/\//.test(str(i.url, 500)) ? str(i.url, 500) : "",
      minutes: Math.max(1, Math.min(120, Number(i.minutes) || 10)),
      sizeMB: Math.max(0, Math.min(50, Number(i.sizeMB) || 1)),
      competencyCode: str(i.competencyCode, 40),
    };
    return { ...base, sections: sectionsFor(base, str(i.summary, 1500) || undefined) };
  });
  const pkg: Pkg = {
    id: str(body.id, 60) || `pkg-${Date.now()}`,
    version: str(body.version, 20) || "1.0.0",
    createdAt: new Date().toISOString(),
    sizeMB: Math.round(items.reduce((s, i) => s + i.sizeMB, 0) * 10) / 10,
    items,
    synced: true,
  };
  pkg.bytes = JSON.stringify(pkg).length;
  const s = store();
  s.packages = [...s.packages.filter((p) => p.id !== pkg.id), pkg].slice(-10);
  persist();
  return NextResponse.json({ package: pkg });
}

/** Student devices poll this for the newest package. */
export async function GET() {
  const latest = store().packages.at(-1) ?? null;
  return NextResponse.json({ package: latest, count: store().packages.length });
}
