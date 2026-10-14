"use client";
import Link from "next/link";
import { TEACHER } from "@/lib/config";
import { seedMatches, seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import type { Match, Pkg } from "@/lib/types";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function Overview() {
  const [matches] = useStored<Match[]>("continued.matches", seedMatches);
  const [packages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const approved = matches.filter((m) => m.status === "approved").length;
  const recent = [...packages].reverse().slice(0, 4);

  const stats = [
    { label: "Lessons matched", value: `${approved}/${matches.length}`, hint: "approved by you", tone: "text-blue" },
    { label: "Packages ready", value: String(packages.length), hint: "for student devices", tone: "text-blue" },
    { label: "Student learning progress", value: "82%", hint: "sample class average", tone: "text-green" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Good morning, {TEACHER.name}</h1>
          <p className="text-slate-500">Typhoon signal #2 is up. Your Grade 3 learners can keep going from home.</p>
        </div>
        <Link href="/teacher/curriculum" className="btn-primary">⬆ Upload curriculum</Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`mt-1 text-3xl font-extrabold ${s.tone}`}>{s.value}</div>
            <div className="text-xs text-slate-400">{s.hint}</div>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-bold text-navy">Recent activity</h2>
        <ul className="divide-y divide-slate-100">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="font-semibold">Package v{p.version} · {p.items.length} lessons</div>
                <div className="text-xs text-slate-400">{fmt(p.createdAt)} · {p.sizeMB} MB</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.synced ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>{p.synced ? "Synced" : "Syncing…"}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 py-3 text-sm">
            <div><div className="font-semibold">Quiz results received from 18 students</div><div className="text-xs text-slate-400">Oct 12, 4:10 PM</div></div>
            <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">Synced</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
