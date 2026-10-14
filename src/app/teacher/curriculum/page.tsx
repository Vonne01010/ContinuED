"use client";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_SYLLABUS, buildItems, catalogById, competencyByCode, makePackage, seedMatches, seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import { Button, Card, ErrorState, ProgressBar } from "@/components/ui";
import type { Match, Pkg, RawMatch } from "@/lib/types";

type Source = "sample" | "ai" | "ai+fallback";

const confColor = (c: number) => (c >= 0.8 ? "green" : c >= 0.55 ? "amber" : "blue");
const DemoTag = () => <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Demo</span>;

export default function Curriculum() {
  const [text, setText] = useStored<string>("continued.syllabusText", SAMPLE_SYLLABUS.join("\n"));
  const [matches, setMatches] = useStored<Match[]>("continued.matches", seedMatches);
  const [source, setSource] = useStored<Source>("continued.matchSource", "sample");
  const [packages, setPackages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const [, setCurrent] = useStored<Pkg | null>("continued.currentPackage", null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const approved = matches.filter((m) => m.status === "approved").length;
  const items = buildItems(matches);
  const lessonCount = text.split("\n").filter((l) => l.trim()).length;

  async function run() {
    const lessons = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lessons.length) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessons }) });
      if (!res.ok) throw new Error("bad response");
      const data: { matches: RawMatch[]; source: string } = await res.json();
      // Confident matches are pre-approved; the rest wait for the teacher.
      setMatches(data.matches.map((m) => ({ ...m, status: m.confidence >= 0.8 ? "approved" : "pending" })));
      setSource(data.source === "ai" ? "ai" : data.source === "ai+fallback" ? "ai+fallback" : "sample");
    } catch {
      setError("We couldn't reach the matching service. Your syllabus is safe, please try again.");
    } finally {
      setLoading(false);
    }
  }

  const setStatus = (i: number, status: Match["status"]) => setMatches((p) => p.map((m, j) => (j === i ? { ...m, status: m.status === status ? "pending" : status } : m)));

  async function onFile(f: File | undefined) {
    if (!f) return;
    const raw = await f.text();
    let lines: string[];
    try {
      const j = JSON.parse(raw);
      lines = Array.isArray(j) ? j.map(String) : raw.split("\n");
    } catch {
      lines = raw.split("\n");
    }
    setText(lines.map((l) => l.replace(/^\s*(\d+[.)]|[-*])\s*/, "").trim()).filter(Boolean).join("\n"));
  }

  function build() {
    if (!items.length || (progress !== null && progress < 100)) return;
    const pkg = makePackage(items, packages.length + 1);
    setPackages((p) => [...p, pkg]);
    setCurrent(pkg); // the student app reads this key
    setProgress(0);
    let v = 0;
    timer.current = setInterval(() => {
      v = Math.min(100, v + 4 + Math.random() * 6);
      setProgress(Math.round(v));
      if (v >= 100) {
        if (timer.current) clearInterval(timer.current);
        setPackages((p) => p.map((x) => (x.id === pkg.id ? { ...x, synced: true } : x)));
        setCurrent({ ...pkg, synced: true });
      }
    }, 150);
  }

  const latest = packages[packages.length - 1];
  const stats = [
    { label: "Lessons matched", value: `${approved}/${matches.length}`, hint: "approved by you" },
    { label: "Packages ready", value: String(packages.length), hint: latest ? `latest v${latest.version}` : "none yet" },
    { label: "Student progress", value: "82%", hint: "sample class average" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">Curriculum</h1>
        <p className="text-slate-500">Map your syllabus, match each lesson to a free resource, then build a package for offline learners.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-sm font-semibold text-slate-500">{s.label}</div>
            <div className="mt-1 text-3xl font-extrabold text-blue" data-testid={s.label === "Lessons matched" ? "matched-stat" : undefined}>{s.value}</div>
            <div className="text-xs text-slate-400">{s.hint}</div>
          </Card>
        ))}
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-extrabold" htmlFor="syl">1 · Syllabus lessons <span className="font-medium text-slate-400">(one per line)</span></label>
          <label className="btn-ghost cursor-pointer text-xs">
            Upload .txt / .json
            <input type="file" accept=".txt,.csv,.json,text/plain" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        <textarea id="syl" value={text} onChange={(e) => setText(e.target.value)} rows={7} className="w-full rounded-xl border border-slate-200 bg-mist/40 p-3 text-sm focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20" />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={loading || !lessonCount}>{loading ? "Matching…" : "✨ Run AI matching"}</Button>
          {loading && <span className="text-sm text-slate-500">Matching {lessonCount} lessons…</span>}
          {!loading && source === "sample" && <span className="text-sm text-slate-500">Showing sample matches</span>}
          {!loading && source === "ai" && <span className="text-sm font-semibold text-green">Matched by AI</span>}
          {!loading && source === "ai+fallback" && <span className="text-sm text-slate-500">Matched by AI · a few lessons show sample matches</span>}
        </div>
        {error && <ErrorState title="Matching didn't finish" body={error} action={<Button variant="secondary" onClick={run}>Try again</Button>} />}
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-extrabold">2 · Review matches</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>{["Lesson", "Matched resource", "Competency", "Confidence", "Reason", "Decision"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {matches.map((m, i) => {
                const r = catalogById(m.resourceId);
                const c = competencyByCode(m.competencyCode);
                return (
                  <tr key={i} className={`border-b border-slate-100 align-top last:border-0 ${m.status === "rejected" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-bold">{m.lesson}</td>
                    <td className="px-4 py-3">
                      {r ? <a className="font-semibold text-blue hover:underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : "—"}
                      <div className="text-xs text-slate-400">{r?.source} · {r?.estimatedMinutes} min</div>
                    </td>
                    <td className="px-4 py-3" title={c?.description}><span className="font-mono text-xs">{m.competencyCode}</span><div className="line-clamp-2 max-w-[220px] text-xs text-slate-500">{c?.description}</div></td>
                    <td className="w-36 px-4 py-3">
                      <div className="mb-1 text-xs font-extrabold">{Math.round(m.confidence * 100)}%</div>
                      <ProgressBar value={m.confidence * 100} color={confColor(m.confidence)} label={`Confidence for ${m.lesson}`} />
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-slate-600">{m.reason}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setStatus(i, "approved")} aria-pressed={m.status === "approved"} aria-label={`Approve ${m.lesson}`} className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${m.status === "approved" ? "bg-green text-white ring-green" : "bg-white text-green ring-green/40 hover:bg-green/10"}`}>✓ Approve</button>
                        <button onClick={() => setStatus(i, "rejected")} aria-pressed={m.status === "rejected"} aria-label={`Reject ${m.lesson}`} className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${m.status === "rejected" ? "bg-danger text-white ring-danger" : "bg-white text-danger ring-danger/40 hover:bg-danger/10"}`}>✕ Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold">3 · Build package <DemoTag /></h2>
            <p className="text-sm text-slate-500">{items.length} approved lessons · about {Math.round(items.reduce((s, i) => s + i.sizeMB, 0) * 10) / 10} MB. Syncing to the school server is simulated.</p>
          </div>
          <Button onClick={build} disabled={!items.length || (progress !== null && progress < 100)}>📦 Build package</Button>
        </div>
        {!items.length && <p className="text-sm text-amber-700">Approve at least one match to build a package.</p>}
        {progress !== null && (
          <div className="space-y-2" role="status">
            <div className="flex justify-between text-sm font-bold">
              <span className={progress >= 100 ? "text-green" : ""}>{progress < 100 ? `Syncing to school server… ${progress}%` : `✓ Synced to school server · v${latest?.version}`}</span>
              <DemoTag />
            </div>
            <ProgressBar value={progress} color={progress >= 100 ? "green" : "blue"} label="Sync progress" />
          </div>
        )}
        {progress === 100 && latest && (
          <details className="rounded-xl bg-navy p-3 text-xs text-green-200" open>
            <summary className="cursor-pointer font-bold text-white">Manifest · v{latest.version} · {latest.sizeMB} MB · {new Date(latest.createdAt).toLocaleString("en-PH")}</summary>
            <pre className="mt-2 max-h-56 overflow-auto">{JSON.stringify({ version: latest.version, createdAt: latest.createdAt, sizeMB: latest.sizeMB, items: latest.items.map((i) => ({ id: i.resourceId, lesson: i.lesson, source: i.source, sizeMB: i.sizeMB })) }, null, 2)}</pre>
          </details>
        )}
      </Card>
    </div>
  );
}
