"use client";
import { useEffect, useState } from "react";
import { SAMPLE_SYLLABUS, buildItems, catalogById, competencyByCode, makePackage, seedMatches, seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import { useCatalog } from "@/lib/useCatalog";
import { Button, Card, ErrorState, ProgressBar } from "@/components/ui";
import { PageHeader, SourceBadge, StatTile, Tip } from "@/components/extras";
import type { CatalogItem, Match, Pkg, RawMatch } from "@/lib/types";

type Source = "sample" | "ai" | "ai+fallback";
type Phase = { pct: number; label: string; error?: string; done?: boolean };

const TOPICS = ["Place value", "Addition", "Subtraction", "Multiplication", "Division", "Fractions", "Measurement and data", "Geometry"];
const confColor = (c: number) => (c >= 0.8 ? "green" : c >= 0.55 ? "amber" : "blue");

export default function LessonPlan() {
  const [text, setText] = useStored<string>("continued.syllabusText", SAMPLE_SYLLABUS.join("\n"));
  const [matches, setMatches] = useStored<Match[]>("continued.matches", seedMatches);
  const [source, setSource] = useStored<Source>("continued.matchSource", "sample");
  const [packages, setPackages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const [, setCurrent] = useStored<Pkg | null>("continued.currentPackage", null);
  const { catalog, custom, add, remove } = useCatalog();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase | null>(null);
  const [progressAvg, setProgressAvg] = useState<{ avg: number; students: number } | null>(null);

  // resource library
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState(TOPICS[6]);
  const [found, setFound] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [libMsg, setLibMsg] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const approved = matches.filter((m) => m.status === "approved").length;
  const items = buildItems(matches, catalog);
  const lessonCount = text.split("\n").filter((l) => l.trim()).length;
  const building = phase !== null && !phase.done && !phase.error;

  // real student progress, as received by the school server
  useEffect(() => {
    const load = () =>
      fetch("/api/sync", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { students: { avgProgress: number }[] }) => setProgressAvg(d.students.length ? { avg: Math.round(d.students.reduce((a, s) => a + s.avgProgress, 0) / d.students.length), students: d.students.length } : null))
        .catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  async function run() {
    const lessons = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lessons.length) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessons, resources: custom }) });
      if (!res.ok) throw new Error("bad response");
      const data: { matches: RawMatch[]; source: string } = await res.json();
      // Confident matches are pre-approved; the rest wait for the teacher.
      setMatches(data.matches.map((m) => ({ ...m, status: m.confidence >= 0.8 ? "approved" : "pending" })));
      setSource(data.source === "ai" ? "ai" : data.source === "ai+fallback" ? "ai+fallback" : "sample");
    } catch {
      setError("We couldn't reach the matching service. Your lesson plan is safe, please try again.");
    } finally {
      setLoading(false);
    }
  }

  const setStatus = (i: number, status: Match["status"]) => setMatches((p) => p.map((m, j) => (j === i ? { ...m, status: m.status === status ? "pending" : status } : m)));
  const setResource = (i: number, resourceId: string) => setMatches((p) => p.map((m, j) => (j === i ? { ...m, resourceId, status: "approved", confidence: 1, reason: "Chosen by the teacher." } : m)));

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

  async function search() {
    if (q.trim().length < 2) return;
    setSearching(true);
    setLibMsg("");
    setFound([]);
    try {
      const res = await fetch(`/api/resources/search?q=${encodeURIComponent(q.trim())}&topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setFound(data.resources);
      if (!data.resources.length) setLibMsg("No results. Try a simpler word.");
    } catch (e) {
      setLibMsg(`Couldn't search: ${e instanceof Error ? e.message : "no connection"}`);
    } finally {
      setSearching(false);
    }
  }

  async function importFromUrl() {
    if (!importUrl.trim()) return;
    setLibMsg("");
    try {
      const res = await fetch("/api/resources/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: importUrl.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      add(data.resources);
      setLibMsg(`Imported ${data.resources.length} resources.`);
      setImportUrl("");
    } catch (e) {
      setLibMsg(`Couldn't import: ${e instanceof Error ? e.message : "no connection"}`);
    }
  }

  /** Builds the package, uploads it to the school server (this app's /api/packages) and verifies it is there. */
  async function build() {
    if (!items.length || building) return;
    const draft = makePackage(items, packages.length + 1);
    try {
      setPhase({ pct: 10, label: `Preparing ${items.length} lessons…` });
      await new Promise((r) => setTimeout(r, 400));
      setPhase({ pct: 35, label: "Uploading to the school server…" });
      const res = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: draft.id, version: draft.version, items: draft.items }), signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server responded ${res.status}`);
      const pkg: Pkg = data.package;
      setPhase({ pct: 75, label: "Verifying on the school server…" });
      const check = await fetch("/api/packages", { cache: "no-store" }).then((r) => r.json());
      if (check.package?.id !== pkg.id) throw new Error("The server did not confirm the upload");
      setPackages((p) => [...p, pkg]);
      setCurrent(pkg);
      setPhase({ pct: 100, label: `Synced to the school server · v${pkg.version}`, done: true });
    } catch (e) {
      setPhase({ pct: 0, label: "Package not published", error: e instanceof Error ? e.message : "Upload failed" });
    }
  }

  const latest = packages[packages.length - 1];
  const stats = [
    { label: "Lessons matched", value: `${approved}/${matches.length}`, hint: "approved by you", id: "matched-stat" },
    { label: "Packages ready", value: String(packages.length), hint: latest ? `latest v${latest.version}` : "none yet", id: "packages-stat" },
    { label: "Student progress", value: progressAvg ? `${progressAvg.avg}%` : "—", hint: progressAvg ? `from ${progressAvg.students} synced student${progressAvg.students > 1 ? "s" : ""}` : "waiting for a student to sync", id: "progress-stat" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader icon="☰" title="Lesson plan" subtitle="Map your lessons, match each one to a free resource, then build a package for offline learners." />

      <ol className="grid gap-2 sm:grid-cols-3" aria-label="Steps">
        {[
          ["1", "Add your lessons", lessonCount > 0, "Paste or upload"],
          ["2", "Review matches", approved > 0, `${approved} of ${matches.length} approved`],
          ["3", "Build and send", !!phase?.done, phase?.done ? "Sent to students" : "Package for offline"],
        ].map(([n, t, done, hint]) => (
          <li key={String(n)} className={`flex items-center gap-3 rounded-2xl border p-3 ${done ? "border-green/30 bg-green/10" : "border-slate-200 bg-white"}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${done ? "bg-green text-white" : "bg-mist text-slate-500"}`}>{done ? "✓" : n}</span>
            <span><span className="block font-extrabold">{t as string}</span><span className="text-xs text-slate-500">{hint as string}</span></span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, k) => (
          <StatTile key={s.label} icon={["✅", "📦", "📈"][k]} label={s.label} value={<span data-testid={s.id}>{s.value}</span>} hint={s.hint} tone={(["blue", "amber", "green"] as const)[k]} />
        ))}
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-extrabold" htmlFor="syl">1 · Lessons in your plan <span className="font-medium text-slate-400">(one per line)</span></label>
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

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold">Add resources from outside</h2>
          <p className="text-sm text-slate-500">Search a free online source, or import a JSON list from any public https link. Added resources can be matched and are packed into the offline lessons.</p>
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. fractions, perimeter, clock" aria-label="Search online resources" className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20" />
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
          <Button type="submit" disabled={searching || q.trim().length < 2}>{searching ? "Searching…" : "🔎 Search Simple English Wikipedia"}</Button>
        </form>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void importFromUrl(); }}>
          <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://example.org/resources.json" aria-label="Resource JSON URL" className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20" />
          <Button type="submit" variant="secondary" disabled={!importUrl.trim()}>⬇ Import from URL</Button>
        </form>
        {libMsg && <p className="text-sm text-slate-600" role="status">{libMsg}</p>}
        {found.length > 0 && (
          <ul className="grid gap-2 md:grid-cols-2">
            {found.map((r) => {
              const have = custom.some((c) => c.id === r.id);
              return (
                <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="min-w-0">
                    <a href={r.url} target="_blank" rel="noreferrer" className="font-bold text-blue hover:underline">{r.title}</a>
                    <p className="line-clamp-2 text-xs text-slate-500">{r.summary}</p>
                  </div>
                  <Button variant="secondary" className="shrink-0 !px-3 !py-1.5 text-xs" disabled={have} onClick={() => add([r])}>{have ? "Added" : "+ Add"}</Button>
                </li>
              );
            })}
          </ul>
        )}
        {custom.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Your added resources ({custom.length})</div>
            <ul className="flex flex-wrap gap-2">
              {custom.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-xs font-semibold">
                  {r.title} <span className="text-slate-400">· {r.source}</span>
                  <button onClick={() => remove(r.id)} aria-label={`Remove ${r.title}`} className="text-slate-400 hover:text-danger">✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">2 · Review matches</h2>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${filter === f ? "bg-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-mist"}`}>{f} ({f === "all" ? matches.length : matches.filter((m) => m.status === f).length})</button>
            ))}
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setMatches((p) => p.map((m) => (m.status === "pending" && m.confidence >= 0.8 ? { ...m, status: "approved" } : m)))}>✓ Approve all high-confidence</Button>
          </div>
        </div>
        <Tip>Green bars mean the AI is confident. Check amber and blue ones yourself: use the dropdown to pick a better resource, then approve.</Tip>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>{["Lesson", "Matched resource", "Competency", "Confidence", "Reason", "Decision"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {matches.map((m, i) => {
                const r = catalogById(m.resourceId, catalog);
                const c = competencyByCode(m.competencyCode);
                if (filter !== "all" && m.status !== filter) return null;
                return (
                  <tr key={i} className={`border-b border-slate-100 align-top last:border-0 ${m.status === "rejected" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-base font-bold">{m.lesson}</td>
                    <td className="px-4 py-3">
                      <select value={m.resourceId} onChange={(e) => setResource(i, e.target.value)} aria-label={`Resource for ${m.lesson}`} className="w-60 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-navy">
                        {!r && <option value={m.resourceId}>{m.resourceId}</option>}
                        {catalog.map((c2) => <option key={c2.id} value={c2.id}>{c2.title} ({c2.source})</option>)}
                      </select>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">{r ? <><SourceBadge source={r.source} link={r.url} />{r.estimatedMinutes} min</> : "Unknown resource"}</div>
                    </td>
                    <td className="px-4 py-3" title={c?.description}><span className="font-mono text-xs">{m.competencyCode}</span><div className="line-clamp-2 max-w-[220px] text-xs text-slate-500">{c?.description}</div></td>
                    <td className="w-36 px-4 py-3">
                      <div className="mb-1 text-xs font-extrabold">{Math.round(m.confidence * 100)}%</div>
                      <ProgressBar value={m.confidence * 100} color={confColor(m.confidence)} label={`Confidence for ${m.lesson}`} />
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-sm text-slate-600">{m.reason}</td>
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
            <h2 className="text-sm font-extrabold">3 · Build package</h2>
            <p className="text-sm text-slate-500">{items.length} approved lessons · about {Math.round(items.reduce((s, i) => s + i.sizeMB, 0) * 10) / 10} MB. Lessons are packed with offline notes and checks, then uploaded to the school server; student devices download them when online.</p>
          </div>
          <Button onClick={build} disabled={!items.length || building}>{building ? "Building…" : "📦 Build package"}</Button>
        </div>
        {!items.length && <p className="text-sm text-amber-700">Approve at least one match to build a package.</p>}
        {phase && !phase.error && (
          <div className="space-y-2" role="status">
            <div className={`text-sm font-bold ${phase.done ? "text-green" : ""}`}>{phase.done ? "✓ " : ""}{phase.label}</div>
            <ProgressBar value={phase.pct} color={phase.done ? "green" : "blue"} label="Build progress" />
          </div>
        )}
        {phase?.error && <ErrorState title={phase.label} body={phase.error} action={<Button variant="secondary" onClick={build}>Try again</Button>} />}
        {phase?.done && latest && (
          <details className="rounded-xl bg-navy p-3 text-xs text-green-200" open>
            <summary className="cursor-pointer font-bold text-white">Manifest · v{latest.version} · {latest.sizeMB} MB{latest.bytes ? ` · ${(latest.bytes / 1024).toFixed(1)} KB on server` : ""} · {new Date(latest.createdAt).toLocaleString("en-PH")}</summary>
            <pre className="mt-2 max-h-56 overflow-auto">{JSON.stringify({ id: latest.id, version: latest.version, createdAt: latest.createdAt, sizeMB: latest.sizeMB, items: latest.items.map((i) => ({ id: i.resourceId, lesson: i.lesson, source: i.source, sizeMB: i.sizeMB, sections: i.sections?.length })) }, null, 2)}</pre>
          </details>
        )}
        <p className="text-xs text-slate-400">The &ldquo;school server&rdquo; here is this app&apos;s own server. It keeps packages in memory and a temp file, so on serverless hosting they can reset.</p>
      </Card>
    </div>
  );
}
