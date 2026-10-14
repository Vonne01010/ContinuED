"use client";
import Link from "next/link";
import { Card } from "@/components/ui";
import { Avatar, PageHeader, StatTile } from "@/components/extras";
import { seedMatches, seedPackages } from "@/lib/data";
import { TEACHER_PROFILE as T } from "@/lib/profiles";
import { useStored } from "@/lib/useStored";
import type { Match, Pkg } from "@/lib/types";

export default function TeacherProfile() {
  const [matches] = useStored<Match[]>("continued.matches", seedMatches);
  const [packages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const approved = matches.filter((m) => m.status === "approved").length;

  const rows: [string, string][] = [
    ["Full name", T.fullName],
    ["School", T.school],
    ["Division", T.division],
    ["Advisory class", T.advisory],
    ["Email", T.email],
    ["Phone", T.phone],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 page-enter">
      <PageHeader icon="☺" title="Profile" subtitle="Your teacher profile. Details are demo data." />

      <Card className="relative overflow-hidden !p-0">
        <div className="h-24 bg-gradient-to-r from-navy via-[#1a3a8f] to-blue md:h-32" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <div className="-mt-10 md:-mt-12"><Avatar emoji={T.avatar} size={96} ring /></div>
          <div className="flex-1 pt-2">
            <h2 className="text-2xl font-extrabold">{T.fullName}</h2>
            <p className="text-slate-500">{T.role} · {T.school}</p>
          </div>
          <Link href="/teacher/lesson-plan" className="btn-primary">Open lesson plan</Link>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon="👩‍🎓" label="Students" value={T.students} hint={T.advisory} tone="blue" />
        <StatTile icon="📚" label="Lessons approved" value={approved} hint={`of ${matches.length} in your plan`} tone="green" />
        <StatTile icon="📦" label="Packages built" value={packages.length} hint="for student devices" tone="amber" />
        <StatTile icon="🎓" label="Years teaching" value={T.yearsTeaching} hint="and counting" tone="navy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-extrabold">About me</h2>
          <p className="rounded-xl bg-mist p-3 text-sm italic text-slate-600">&ldquo;{T.bio}&rdquo;</p>
          <dl className="divide-y divide-slate-100 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-bold">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-lg font-extrabold">Subjects and strengths</h2>
            <div className="flex flex-wrap gap-2">{T.subjects.map((s) => <span key={s} className="rounded-full bg-blue/10 px-3 py-1 text-sm font-bold text-blue">{s}</span>)}</div>
            <ul className="space-y-2 text-sm">{T.strengths.map((s) => <li key={s} className="flex items-center gap-2 rounded-xl bg-mist px-3 py-2 font-semibold"><span aria-hidden>⭐</span>{s}</li>)}</ul>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-extrabold">This week</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {T.schedule.map(([d, t, what]) => (
                <li key={what} className="flex items-start gap-3 py-2"><span className="w-20 shrink-0 font-bold text-blue">{d}</span><span className="w-16 shrink-0 text-slate-500">{t}</span><span className="font-semibold">{what}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
