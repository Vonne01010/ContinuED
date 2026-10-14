"use client";
import { useEffect, useState } from "react";
import { Button, Card, EmptyState, LessonCard, StatusChip } from "@/components/ui";
import { useOnline } from "@/lib/useOnline";
import { usePackage, useSyncQueue } from "@/lib/useStudent";

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not yet");
const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

export default function OfflineLibrary() {
  const { pkg } = usePackage();
  const { queue, waiting, syncing, lastSync, syncNow } = useSyncQueue();
  const online = useOnline();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => e.usage !== undefined && e.quota !== undefined && setStorage({ usage: e.usage, quota: e.quota })).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">Learn Anywhere</h1>
        <p className="text-lg font-semibold text-slate-600">Your lessons are ready, even without internet.</p>
        <p className="text-sm text-slate-500">Package v{pkg.version} · {pkg.items.length} lessons · {pkg.sizeMB} MB</p>
      </header>

      <Card className="space-y-4" as="section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold">
            <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green" : "bg-amber"}`} aria-hidden />
            {online ? "Connected to the internet" : "Offline. Everything here still works."}
          </div>
          <Button onClick={syncNow} disabled={!online || waiting === 0 || syncing}>{syncing ? "Syncing…" : "↻ Sync now"}</Button>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-mist p-3"><div className="text-xs font-semibold text-slate-500">Last sync</div><div className="font-bold">{fmtTime(lastSync)}</div></div>
          <div className="rounded-xl bg-mist p-3"><div className="text-xs font-semibold text-slate-500">Waiting to sync</div><div className="font-bold" data-testid="waiting-count">{waiting}</div></div>
          {storage && <div className="rounded-xl bg-mist p-3"><div className="text-xs font-semibold text-slate-500">Storage on this device</div><div className="font-bold">{mb(storage.usage)} used</div></div>}
        </div>
        <p className="text-xs text-slate-400">Demo: Sync now is simulated. No data is sent anywhere.{!online && " Reconnect to sync."}</p>
      </Card>

      {queue.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-extrabold">Progress queue</h2>
          <ul className="space-y-2">
            {queue.slice(0, 5).map((q) => (
              <li key={q.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
                <div><div className="font-bold">{q.label}</div><div className="text-xs text-slate-500">+{q.xp} XP · {fmtTime(q.at)}</div></div>
                <StatusChip kind={q.status === "synced" ? "synced" : q.status === "syncing" ? "syncing" : "waiting"} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">Downloaded lessons</h2>
        {pkg.items.length === 0 ? (
          <EmptyState icon="📥" title="No lessons yet" body="Ask your teacher to build a package, then it will appear here." />
        ) : (
          <ul className="space-y-3">
            {pkg.items.map((it) => (
              <LessonCard
                key={it.lesson}
                title={it.lesson}
                meta={`${it.source} · ${it.minutes} min · ${it.sizeMB} MB`}
                chips={<><StatusChip kind="offline" /><StatusChip kind="needsNet" label="Full resource needs internet" /></>}
                right={<a href={it.url} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-bold text-blue">Open ↗</a>}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
