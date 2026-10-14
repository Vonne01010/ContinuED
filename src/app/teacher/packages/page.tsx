"use client";
import Link from "next/link";
import { useState } from "react";
import { seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import { EmptyState } from "@/components/ui";
import type { Pkg } from "@/lib/types";

export default function Packages() {
  const [packages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const [open, setOpen] = useState<string | null>(null);
  const latest = packages[packages.length - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Packages</h1>
          <p className="text-sm text-slate-500">Every package you have built. Build new ones from the lesson plan.</p>
        </div>
        <Link href="/teacher/lesson-plan" className="btn-primary">📦 Build a package</Link>
      </header>
      {packages.length === 0 && <EmptyState icon="📦" title="No packages yet" body="Approve some matches in your lesson plan, then build a package." />}
      <section className="space-y-3">
        {[...packages].reverse().map((p) => (
          <div key={p.id} className="card p-4">
            <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
              <div>
                <div className="font-bold text-navy">Package v{p.version}{p.id === latest?.id && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs text-blue">latest</span>}</div>
                <div className="text-xs text-slate-500">{p.items.length} lessons · {p.sizeMB} MB · {new Date(p.createdAt).toLocaleString("en-PH")}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.synced ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>{p.synced ? "Synced" : "Not synced"}</span>
            </button>
            {open === p.id && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-navy p-3 text-xs text-green-200">
                {JSON.stringify({ id: p.id, version: p.version, createdAt: p.createdAt, sizeMB: p.sizeMB, items: p.items.map((i) => ({ id: i.resourceId, lesson: i.lesson, source: i.source, minutes: i.minutes })) }, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
