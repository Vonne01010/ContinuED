"use client";
import { Card, ProgressBar } from "@/components/ui";
import { PageHeader, StatTile } from "@/components/extras";
import { BADGES } from "@/lib/profiles";
import { XP_PER_LEVEL, levelOf, useStudent } from "@/lib/useStudent";

const WEEK = [
  ["Mon", 15],
  ["Tue", 22],
  ["Wed", 8],
  ["Thu", 25],
  ["Fri", 18],
  ["Sat", 0],
  ["Sun", 12],
] as const;

export default function Achievements() {
  const { s } = useStudent();
  const { level, into } = levelOf(s.xp);
  const earned = (id: string) => s.badges.includes(id) || (id === "Streak Starter" && s.streak >= 3) || (id === "Explorer" && Object.keys(s.quizBest).length >= 3);
  const count = BADGES.filter((b) => earned(b.id)).length;
  const max = Math.max(...WEEK.map((w) => w[1]));

  return (
    <div className="stagger space-y-6">
      <PageHeader icon="🏅" title="Achievements" subtitle={`${count} of ${BADGES.length} badges earned. Keep going!`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon="⚡" label="Total XP" value={s.xp.toLocaleString()} hint={`Level ${level}`} tone="amber" />
        <StatTile icon="🔥" label="Day streak" value={s.streak} hint="Study today to keep it" tone="navy" />
        <StatTile icon="🧠" label="Best quiz" value={`${Math.max(0, ...Object.values(s.quizBest))}%`} hint={`${Object.keys(s.quizBest).length} subjects tried`} tone="green" />
      </div>

      <Card className="space-y-2">
        <div className="flex items-center justify-between font-extrabold"><span>Level {level}</span><span className="text-sm text-slate-500">{XP_PER_LEVEL - into} XP to level {level + 1}</span></div>
        <ProgressBar value={(into / XP_PER_LEVEL) * 100} color="amber" label="Level progress" />
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Badges</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const got = earned(b.id);
            return (
              <div key={b.id} className={`card flex items-center gap-4 p-4 ${got ? "" : "opacity-60"}`}>
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${b.tint} ${got ? "" : "grayscale"}`} aria-hidden>{b.icon}</span>
                <div className="min-w-0">
                  <div className="font-extrabold">{b.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${got ? "bg-green/10 text-green" : "bg-mist text-slate-500"}`}>{got ? "Earned" : "Locked"}</span></div>
                  <div className="text-sm text-slate-500">{b.how}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Card className="space-y-4">
        <h2 className="text-lg font-extrabold">Minutes studied this week <span className="text-xs font-semibold text-slate-400">(sample)</span></h2>
        <div className="flex h-40 items-end gap-3">
          {WEEK.map(([d, m]) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-bold text-slate-500">{m}</span>
              <div className="w-full rounded-t-xl bg-gradient-to-t from-blue to-blue/60" style={{ height: `${Math.max(4, (m / max) * 100)}%` }} />
              <span className="text-xs font-bold text-slate-400">{d}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
