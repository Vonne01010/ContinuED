"use client";
import { useEffect, useRef, useState } from "react";
import { buildItems, makePackage, seedMatches, seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import type { Match, Pkg } from "@/lib/types";

export default function Packages() {
  const [matches] = useStored<Match[]>("continued.matches", seedMatches);
  const [packages, setPackages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const [, setCurrent] = useStored<Pkg | null>("continued.currentPackage", null);
  const [progress, setProgress] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = buildItems(matches);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function build() {
    if (!items.length || progress !== null) return;
    const pkg = makePackage(items, packages.length + 1);
    setPackages((p) => [...p, pkg]);
    setCurrent(pkg); // the student app reads this key
    setOpen(pkg.id);
    setProgress(0);
    let v = 0;
    timer.current = setInterval(() => {
      v = Math.min(100, v + 4 + Math.random() * 6);
      setProgress(Math.round(v));
      if (v >= 100) {
        if (timer.current) clearInterval(timer.current);
        setPackages((p) => p.map((x) => (x.id === pkg.id ? { ...x, synced: true } : x)));
        setCurrent({ ...pkg, synced: true });
        setTimeout(() => setProgress(null), 1200);
      }
    }, 150);
  }

  const latest = packages[packages.length - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Packages</h1>
          <p className="text-sm text-slate-500">Bundle approved lessons and sync them to the school server for offline students.</p>
        </div>
        <button className="btn-primary" onClick={build} disabled={!items.length || progress !== null}>📦 Build package ({items.length} lessons)</button>
      </header>

      {!items.length && <div className="card p-4 text-sm text-amber-700">No approved lessons yet. Approve some matches in Curriculum first.</div>}

      {progress !== null && (
        <div className="card space-y-2 p-5" role="status">
          <div className="flex justify-between text-sm font-semibold">
            <span>{progress < 100 ? `Syncing to school server… ${progress}%` : "✓ Synced to school server"}</span>
            <span className="text-slate-400">simulated</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      <section className="space-y-3">
        {[...packages].reverse().map((p) => (
          <div key={p.id} className="card p-4">
            <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <div>
                <div className="font-bold text-navy">Package v{p.version}{p.id === latest?.id && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs text-blue">latest</span>}</div>
                <div className="text-xs text-slate-500">{p.items.length} lessons · {p.sizeMB} MB · {new Date(p.createdAt).toLocaleString("en-PH")}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.synced ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>{p.synced ? "Synced" : "Syncing…"}</span>
            </button>
            {open === p.id && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-green-200">
                {JSON.stringify({ version: p.version, createdAt: p.createdAt, sizeMB: p.sizeMB, items: p.items.map((i) => ({ id: i.resourceId, lesson: i.lesson, minutes: i.minutes })) }, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
