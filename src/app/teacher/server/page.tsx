"use client";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui";

type Status = {
  students: { id: string; name: string; xp: number; streak: number; avgProgress: number; lastSync: string; results: number }[];
  results: { id: string; label: string; xp: number; at: string; student: string }[];
  packages: { id: string; version: string; createdAt: string; sizeMB: number; bytes?: number; lessons: number }[];
};
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

export default function SchoolServer() {
  const [st, setSt] = useState<Status | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch("/api/sync", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setSt(d);
          setErr(false);
        })
        .catch(() => setErr(true));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const lastPkg = st?.packages.at(-1);
  const kb = st ? Math.round(st.packages.reduce((s, p) => s + (p.bytes ?? 0), 0) / 1024) : 0;
  const cards = [
    ["Status", err ? "● Unreachable" : st ? "● Online" : "…", err ? "text-danger" : "text-green"],
    ["Last package", fmt(lastPkg?.createdAt), "text-navy"],
    ["Stored on server", `${st?.packages.length ?? 0} packages · ${kb} KB`, "text-navy"],
    ["Student devices synced", String(st?.students.length ?? 0), "text-navy"],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">School server</h1>
        <p className="text-sm text-slate-500">Live view of what this app&apos;s server has received. It refreshes every few seconds.</p>
      </header>
      {err && <ErrorState title="Cannot reach the server" body="Check your connection. This page will retry automatically." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v, t]) => (
          <div key={l} className="card p-5"><div className="text-sm text-slate-500">{l}</div><div className={`mt-1 text-lg font-extrabold ${t}`}>{v}</div></div>
        ))}
      </div>
      <section className="card p-5">
        <h2 className="mb-3 font-bold text-navy">Student devices</h2>
        {st && st.students.length === 0 ? (
          <p className="text-sm text-slate-500">No student has synced yet. Open the student app, finish a quiz, and it will appear here.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {st?.students.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-semibold">{s.name} <span className="text-xs text-slate-400">#{s.id.slice(-4)}</span></span>
                <span className="text-slate-500">{s.avgProgress}% progress · {s.xp} XP · {s.streak}-day streak · {s.results} results</span>
                <span className="text-xs text-slate-400">synced {fmt(s.lastSync)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-slate-400">Storage is in memory plus a temp file on this app&apos;s server. On serverless hosting it can reset; use a database for production.</p>
    </div>
  );
}
