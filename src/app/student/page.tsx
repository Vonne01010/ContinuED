"use client";
import Link from "next/link";
import { Card, CircularProgress, ProgressBar, StatusChip, SubjectCard } from "@/components/ui";
import { SourceBadge } from "@/components/extras";
import { DAILY_GOAL_MIN, STUDENT, SUBJECTS } from "@/lib/config";
import { ACTIVITY, BADGES } from "@/lib/profiles";
import { useOnline } from "@/lib/useOnline";
import { XP_PER_LEVEL, levelOf, lessonStatuses, today, usePackage, useStudent, useSyncQueue } from "@/lib/useStudent";

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not yet");
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function StudentHome() {
  const { s } = useStudent();
  const { pkg } = usePackage();
  const { waiting, lastSync } = useSyncQueue();
  const online = useOnline();

  const lessons = lessonStatuses(pkg.items, s.progress);
  const current = lessons.find((l) => l.status === "progress");
  const doneCount = lessons.filter((l) => l.status === "done").length;
  const mathPct = lessons.length ? Math.round(lessons.reduce((a, l) => a + l.pct, 0) / lessons.length) : 0;
  const { level, into } = levelOf(s.xp);
  const goalPct = Math.min(100, Math.round((s.minutesToday / DAILY_GOAL_MIN) * 100));
  const lessonHref = current ? `/student/lesson?lesson=${encodeURIComponent(current.lesson)}` : "/student";

  // 7-day streak dots, counting back from today (or yesterday if nothing done yet today)
  const start = s.lastDay === today() ? 0 : 1;
  const week = Array.from({ length: 7 }, (_, k) => {
    const ago = 6 - k;
    const d = new Date();
    d.setDate(d.getDate() - ago);
    return { label: DAYS[d.getDay()], active: ago >= start && ago - start < s.streak, today: ago === 0 };
  });

  const earned = (id: string) => s.badges.includes(id) || (id === "Streak Starter" && s.streak >= 3) || (id === "Explorer" && Object.keys(s.quizBest).length >= 3);
  const path = lessons.slice(Math.max(0, lessons.findIndex((l) => l.status === "progress") - 1), undefined).slice(0, 5);

  return (
    <div className="stagger space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-amber/20 via-amber/10 to-transparent p-4 md:p-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Hey, {STUDENT.name}! 👋</h1>
          <p className="text-base font-semibold text-slate-600 md:text-lg">Ready to keep learning today?</p>
          <p className="text-sm text-slate-500">Your learning journey continues, even when classes are paused.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-2 text-sm font-extrabold text-white shadow-soft" data-testid="offline-chip">✓ Offline-ready · {pkg.items.length} lessons downloaded</span>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#1a3a8f] to-blue p-6 text-white shadow-[0_20px_50px_-20px_rgba(37,99,235,.7)] md:p-8" aria-label="Continue learning">
        <svg className="floaty absolute -right-4 -top-4 h-40 w-40 opacity-40 md:right-6 md:top-4 md:h-64 md:w-64 md:opacity-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="62" cy="38" r="26" fill="#60A5FA" opacity=".6" />
          <rect x="14" y="48" width="40" height="40" rx="10" fill="#F59E0B" transform="rotate(-12 34 68)" />
          <path d="M58 90 L84 52 L98 90 Z" fill="#16A34A" opacity=".9" />
          <circle cx="30" cy="22" r="7" fill="#fff" opacity=".8" />
        </svg>
        <div className="relative max-w-lg space-y-4">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/20 px-3 py-1">➗ Mathematics</span>
            <span className="rounded-full bg-white/20 px-3 py-1">{STUDENT.grade}</span>
          </div>
          {current ? (
            <>
              <h2 className="text-2xl font-extrabold leading-tight md:text-4xl">{current.lesson}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-blue-100">Learn from</span><SourceBadge source={current.source} onDark /></div>
              <div className="flex items-center gap-4">
                <CircularProgress value={current.pct} size={72} onDark><span className="text-white">{current.pct}%</span></CircularProgress>
                <div className="text-sm text-blue-100">
                  <div className="font-bold text-white">{current.pct > 0 ? "You are on a roll!" : "A fresh start"}</div>
                  about {Math.max(1, Math.round(current.minutes * (1 - current.pct / 100)))} min left
                </div>
              </div>
              <Link href={lessonHref} className="btn bg-amber px-7 py-3.5 text-base font-extrabold text-navy shadow-lg hover:bg-amber-400">{current.pct > 0 ? "Continue Learning →" : "Start Learning →"}</Link>
            </>
          ) : (
            <h2 className="text-2xl font-extrabold">All lessons done. Try a practice quiz! 🌟</h2>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3">
          <div className="flex items-center justify-between"><div className="font-extrabold">⚡ Level {level}</div><span className="text-sm font-bold text-amber-700">{s.xp} XP</span></div>
          <ProgressBar value={(into / XP_PER_LEVEL) * 100} color="amber" label="Level progress" />
          <div className="text-xs text-slate-500">{XP_PER_LEVEL - into} XP to level {level + 1}. Finish lessons (+15 XP) and quiz answers (+10 XP).</div>
        </Card>
        <Card className="space-y-3">
          <div className="flex items-center justify-between"><div className="font-extrabold">🔥 {s.streak}-day streak</div><span className="text-xs text-slate-500">Study today to keep it</span></div>
          <div className="flex justify-between">
            {week.map((d, k) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${d.active ? "bg-orange-500 text-white" : "bg-mist text-slate-400"} ${d.today ? "ring-2 ring-blue ring-offset-2" : ""}`}>{d.active ? "🔥" : ""}</span>
                <span className="text-[11px] font-bold text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <CircularProgress value={goalPct}><span>{goalPct}%</span></CircularProgress>
          <div>
            <div className="font-extrabold">🎯 Daily goal</div>
            <div className="text-sm text-slate-500">{s.minutesToday} of {DAILY_GOAL_MIN} min today</div>
            <div className="mt-1 text-sm font-semibold text-blue">{goalPct >= 100 ? "Goal reached. Great work!" : "A little each day adds up."}</div>
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Your learning path</h2><Link href="/student/my-learning" className="text-sm font-bold text-blue">See all lessons →</Link></div>
        <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-1 before:rounded-full before:bg-mist md:before:left-[31px]">
          {path.map((l, k) => (
            <li key={l.lesson} className="relative">
              <Link href={`/student/lesson?lesson=${encodeURIComponent(l.lesson)}`} className={`card flex items-center gap-4 p-3 transition hover:-translate-y-0.5 hover:shadow-lg md:p-4 ${l.status === "progress" ? "border-blue/40 ring-2 ring-blue/20" : ""}`}>
                <span className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold md:h-14 md:w-14 ${l.status === "done" ? "bg-green text-white" : l.status === "progress" ? "bg-blue text-white shadow-lg shadow-blue/40" : "bg-mist text-slate-500"}`}>
                  {l.status === "done" ? "✓" : l.status === "progress" ? "▶" : k + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-snug">{l.lesson}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500"><SourceBadge source={l.source} size="sm" />{l.minutes} min{l.pct > 0 && l.pct < 100 ? ` · ${l.pct}% done` : ""}</span>
                </span>
                <span className="hidden text-sm font-bold text-blue sm:block">{l.status === "done" ? "Review" : l.status === "progress" ? "Continue" : "Start"} →</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Pick a subject</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SUBJECTS.map((sub) => (
            <SubjectCard key={sub.id} name={sub.name} icon={sub.icon} tint={sub.tint} href={sub.id === "math" ? "/student/my-learning" : `/student/quiz?subject=${sub.id}`} note={sub.id === "math" ? `${pkg.items.length} lessons · ${mathPct}%` : s.quizBest[sub.id] !== undefined ? `Best quiz: ${s.quizBest[sub.id]}%` : "Practice quiz ready"} progress={sub.id === "math" ? mathPct : s.quizBest[sub.id] ?? 0} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/student/play" className="card group flex items-center gap-4 bg-gradient-to-br from-green/15 to-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
          <span className="floaty flex h-16 w-16 items-center justify-center rounded-2xl bg-green/20 text-4xl" aria-hidden>🐍</span>
          <span><span className="block text-lg font-extrabold">Play Math Snake</span><span className="text-sm text-slate-600">Eat the right answer to grow. Earn XP while you play.</span></span>
        </Link>
        <Link href="/student/nearby" className="card group flex items-center gap-4 bg-gradient-to-br from-blue/10 to-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue/15 text-4xl" aria-hidden>📡</span>
          <span><span className="block text-lg font-extrabold">Share with a classmate</span><span className="text-sm text-slate-600">Send or get lessons phone-to-phone, with no internet.</span></span>
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Your badges</h2><Link href="/student/achievements" className="text-sm font-bold text-blue">All badges →</Link></div>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.slice(0, 6).map((b) => (
              <div key={b.id} className={`card flex flex-col items-center gap-1 p-3 text-center ${earned(b.id) ? "" : "opacity-50 grayscale"}`} title={b.how}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${b.tint}`} aria-hidden>{b.icon}</span>
                <span className="text-xs font-bold">{b.name}</span>
                <span className="text-[10px] text-slate-400">{earned(b.id) ? "Earned" : "Locked"}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Recent activity</h2>
          <Card className="!p-2">
            <ul className="divide-y divide-slate-100">
              {ACTIVITY.slice(0, 4).map((a) => (
                <li key={a.text} className="flex items-center gap-3 p-3 text-sm"><span className="text-lg" aria-hidden>{a.icon}</span><span className="flex-1">{a.text}</span><span className="text-xs text-slate-400">{a.when}</span></li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 !p-4 text-sm" as="section">
        <div className="flex items-center gap-2 font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green" : "bg-amber"}`} aria-hidden />
          {online ? "Connected" : "No internet. You can still learn."}
        </div>
        <div className="text-slate-500">{pkg.items.length} lessons available offline · {doneCount} done</div>
        <div className="text-slate-500">Last sync: {fmtTime(lastSync)}</div>
        <div>{waiting > 0 ? <StatusChip kind="waiting" label={`${waiting} waiting to sync`} /> : <StatusChip kind="synced" label="All progress synced" />}</div>
      </Card>
    </div>
  );
}
