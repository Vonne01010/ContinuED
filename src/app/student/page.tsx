"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Card, CircularProgress, ProgressBar, StatusChip, StreakBadge, SubjectCard, XPBadge } from "@/components/ui";
import { DAILY_GOAL_MIN, STUDENT } from "@/lib/config";
import { useOnline } from "@/lib/useOnline";
import { XP_PER_LEVEL, levelOf, lessonStatuses, usePackage, useStudent, useSyncQueue } from "@/lib/useStudent";

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not yet");

export default function StudentHome() {
  const { s, addXp, addMinutes, setProgress } = useStudent();
  const { pkg } = usePackage();
  const { waiting, lastSync } = useSyncQueue();
  const online = useOnline();
  const [toast, setToast] = useState("");

  const lessons = lessonStatuses(pkg.items, s.progress);
  const current = lessons.find((l) => l.status === "progress");
  const doneCount = lessons.filter((l) => l.status === "done").length;
  const mathPct = lessons.length ? Math.round(lessons.reduce((a, l) => a + l.pct, 0) / lessons.length) : 0;
  const { level, into } = levelOf(s.xp);
  const goalPct = Math.min(100, Math.round((s.minutesToday / DAILY_GOAL_MIN) * 100));
  const lastBadge = s.badges[s.badges.length - 1];

  function cont() {
    if (!current) return;
    const next = Math.min(100, current.pct + 34);
    setProgress(current.lesson, next);
    addMinutes(Math.max(1, Math.round(current.minutes * 0.34)));
    addXp(5);
    setToast(next >= 100 ? "Lesson complete! +5 XP" : "Nice progress! +5 XP");
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Hey, {STUDENT.name}! 👋</h1>
          <p className="text-lg font-semibold text-slate-600">Ready to keep learning today?</p>
          <p className="text-sm text-slate-500">Your learning journey continues, even when classes are paused.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1.5 text-sm font-bold text-green" data-testid="offline-chip">✓ Offline-ready · {pkg.items.length} lessons downloaded</span>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-soft md:p-8" aria-label="Continue learning">
        <svg className="absolute -right-8 -top-8 h-32 w-32 opacity-30 md:-right-6 md:-top-6 md:h-64 md:w-64 md:opacity-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="62" cy="38" r="26" fill="#2563EB" />
          <rect x="14" y="48" width="40" height="40" rx="10" fill="#F59E0B" transform="rotate(-12 34 68)" />
          <path d="M58 90 L84 52 L98 90 Z" fill="#16A34A" opacity=".9" />
        </svg>
        <div className="relative max-w-md space-y-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1">Mathematics</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{STUDENT.grade}</span>
          </div>
          {current ? (
            <>
              <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">{current.lesson}</h2>
              <div className="space-y-1.5">
                <div className="h-2.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={current.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress"><div className="h-full rounded-full bg-amber transition-all duration-500" style={{ width: `${current.pct}%` }} /></div>
                <div className="text-sm text-blue-100">{current.pct}% complete · about {Math.max(1, Math.round(current.minutes * (1 - current.pct / 100)))} min left</div>
              </div>
              <button onClick={cont} className="btn bg-white px-6 py-3 text-base text-navy hover:bg-mist">Continue Learning →</button>
              {toast && <div className="pop inline-block rounded-xl bg-white/15 px-3 py-2 text-sm font-bold" role="status">⚡ {toast}</div>}
            </>
          ) : (
            <h2 className="text-2xl font-extrabold">All lessons done. Try a practice quiz! 🌟</h2>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex items-center gap-4">
          <CircularProgress value={goalPct}><span>{goalPct}%</span></CircularProgress>
          <div>
            <div className="font-extrabold">Daily goal</div>
            <div className="text-sm text-slate-500">{s.minutesToday} of {DAILY_GOAL_MIN} min today</div>
            <div className="mt-1 text-sm font-semibold text-blue">{goalPct >= 100 ? "Goal reached. Great work!" : "A little each day adds up."}</div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="font-extrabold">Quick actions</div>
          <div className="grid gap-2">
            <Button onClick={cont} disabled={!current}>▶ Continue a Lesson</Button>
            <Link href="/student/quiz" className="btn-ghost">✏️ Take a Practice Quiz</Link>
            <button disabled className="btn-ghost">🃏 Review Flashcards <span className="text-xs text-slate-400">Coming soon</span></button>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">Rewards</div>
            <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-bold text-white">Level {level}</span>
          </div>
          <div className="flex flex-wrap gap-2"><XPBadge xp={s.xp} /><StreakBadge days={s.streak} /></div>
          <div>
            <ProgressBar value={(into / XP_PER_LEVEL) * 100} color="amber" label="Level progress" />
            <div className="mt-1 text-xs text-slate-500">{XP_PER_LEVEL - into} XP to level {level + 1}</div>
          </div>
          {lastBadge && <div className="rounded-xl bg-mist px-3 py-2 text-sm font-bold">🏅 Latest badge: {lastBadge}</div>}
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Your subjects</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SubjectCard name="Mathematics" icon="➗" lessons={pkg.items.length} progress={mathPct} active tint="bg-blue/10" />
          <SubjectCard name="Science" icon="🔬" lessons={12} progress={0} tint="bg-green/10" />
          <SubjectCard name="English" icon="📖" lessons={10} progress={0} tint="bg-amber/15" />
          <SubjectCard name="Filipino" icon="🌴" lessons={10} progress={0} tint="bg-danger/10" />
        </div>
      </section>

      <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 !p-4 text-sm" as="section">
        <div className="flex items-center gap-2 font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green" : "bg-amber"}`} aria-hidden />
          {online ? "Connected" : "No internet. You can still learn."}
        </div>
        <div className="text-slate-500">{pkg.items.length} lessons available offline · {doneCount} done</div>
        <div className="text-slate-500">Last sync: {fmtTime(lastSync)}</div>
        <div>{waiting > 0 ? <StatusChip kind="waiting" label={`${waiting} waiting to sync`} /> : <StatusChip kind="synced" label="All progress synced" />}</div>
      </Card>
    </>
  );
}
