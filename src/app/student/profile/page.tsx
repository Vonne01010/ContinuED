"use client";
import Link from "next/link";
import { Card, ProgressBar, StatusChip } from "@/components/ui";
import { Avatar, PageHeader } from "@/components/extras";
import { ACTIVITY, STUDENT_PROFILE as P } from "@/lib/profiles";
import { useOnline } from "@/lib/useOnline";
import { XP_PER_LEVEL, levelOf, usePackage, useStudent, useSyncQueue } from "@/lib/useStudent";

export default function Profile() {
  const { s } = useStudent();
  const { pkg } = usePackage();
  const { waiting, lastSync } = useSyncQueue();
  const online = useOnline();
  const { level, into } = levelOf(s.xp);
  const rows: [string, string][] = [
    ["Full name", P.fullName],
    ["Grade and section", `${P.grade} - ${P.section}`],
    ["School", P.school],
    ["Adviser", P.adviser],
    ["Student no.", P.studentNo],
    ["Age", String(P.age)],
    ["Joined", P.joined],
    ["Languages", P.languages.join(", ")],
  ];

  return (
    <div className="stagger space-y-6">
      <PageHeader icon="🙂" title="Profile" subtitle="This is you. Details are demo data." />

      <Card className="relative overflow-hidden !p-0">
        <div className="h-24 bg-gradient-to-r from-navy via-[#1a3a8f] to-blue md:h-32" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <div className="-mt-10 md:-mt-12"><Avatar emoji={P.avatar} size={96} ring /></div>
          <div className="flex-1 pt-2">
            <h2 className="text-2xl font-extrabold">{P.fullName}</h2>
            <p className="text-slate-500">{P.grade} · Section {P.section} · {P.school}</p>
          </div>
          <div className="text-right">
            <div className="rounded-full bg-navy px-3 py-1 text-sm font-extrabold text-white">Level {level}</div>
            <div className="mt-1 text-xs text-slate-500">{s.xp} XP · 🔥 {s.streak}-day streak</div>
          </div>
        </div>
        <div className="px-5 pb-5"><ProgressBar value={(into / XP_PER_LEVEL) * 100} color="amber" label="Level progress" /></div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-extrabold">About me</h2>
          <dl className="divide-y divide-slate-100 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-bold">{v}</dd></div>
            ))}
          </dl>
          <p className="rounded-xl bg-mist p-3 text-sm italic text-slate-600">&ldquo;{P.dream}&rdquo;</p>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-lg font-extrabold">My goals</h2>
            <ul className="space-y-2 text-sm">
              {P.goals.map((g) => <li key={g} className="flex items-center gap-2 rounded-xl bg-mist px-3 py-2 font-semibold"><span aria-hidden>🎯</span>{g}</li>)}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              {P.interests.map((i) => <span key={i} className="rounded-full bg-blue/10 px-3 py-1 text-sm font-bold text-blue">{i}</span>)}
            </div>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-extrabold">My device</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>Connection</span><StatusChip kind={online ? "synced" : "waiting"} label={online ? "Online" : "Offline"} /></li>
              <li className="flex items-center justify-between"><span>Package</span><span className="font-bold">v{pkg.version} · {pkg.items.length} lessons</span></li>
              <li className="flex items-center justify-between"><span>Waiting to sync</span><span className="font-bold">{waiting}</span></li>
              <li className="flex items-center justify-between"><span>Last sync</span><span className="font-bold">{lastSync ? new Date(lastSync).toLocaleString("en-PH") : "Not yet"}</span></li>
            </ul>
            <Link href="/student/offline" className="btn-ghost w-full">Open Offline Library</Link>
          </Card>
        </div>
      </div>

      <Card className="!p-2">
        <h2 className="px-3 pt-3 text-lg font-extrabold">Recent activity</h2>
        <ul className="divide-y divide-slate-100">
          {ACTIVITY.map((a) => (
            <li key={a.text} className="flex items-center gap-3 p-3 text-sm"><span className="text-lg" aria-hidden>{a.icon}</span><span className="flex-1">{a.text}</span><span className="text-xs text-slate-400">{a.when}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
