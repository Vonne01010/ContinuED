"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TEACHER } from "@/lib/config";
import { seedMatches, seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import type { Match, Pkg } from "@/lib/types";

type Result = { id: string; kind: string; label: string; xp: number; at: string; student: string };
const fmt = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function Overview() {
  const [matches] = useStored<Match[]>("continued.matches", seedMatches);
  const [packages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const [students, setStudents] = useState<{ avgProgress: number }[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/sync", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setStudents(d.students);
          setResults(d.results);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const approved = matches.filter((m) => m.status === "approved").length;
  const avg = students.length ? Math.round(students.reduce((a, s) => a + s.avgProgress, 0) / students.length) : null;
  const recent = [...packages].reverse().slice(0, 3);

  const stats = [
    { label: "Lessons matched", value: `${approved}/${matches.length}`, hint: "approved by you", tone: "text-blue" },
    { label: "Packages ready", value: String(packages.length), hint: "for student devices", tone: "text-blue" },
    {
      label: "Student learning progress",
      value: avg === null ? "—" : `${avg}%`,
      hint: avg === null ? "waiting for a student to sync" : `from ${students.length} synced student${students.length > 1 ? "s" : ""}`,
      tone: "text-green",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Good morning, {TEACHER.name}</h1>
          <p className="text-slate-500">Classes may be paused, but your Grade 3 learners can keep going from home.</p>
        </div>
        <Link href="/teacher/lesson-plan" className="btn-primary">⬆ Upload lesson plan</Link>
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
          {results.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="font-semibold">{r.student}: {r.label}</div>
                <div className="text-xs text-slate-400">{fmt(r.at)} · +{r.xp} XP · received from a student device</div>
              </div>
              <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">Synced</span>
            </li>
          ))}
          {recent.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="font-semibold">Package v{p.version} · {p.items.length} lessons</div>
                <div className="text-xs text-slate-400">{fmt(p.createdAt)} · {p.sizeMB} MB</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.synced ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>{p.synced ? "Synced" : "Not synced"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
