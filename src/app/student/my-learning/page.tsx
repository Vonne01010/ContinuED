"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, ProgressBar, StatusChip } from "@/components/ui";
import { PageHeader, SourceBadge, Tip } from "@/components/extras";
import { SUBJECTS } from "@/lib/config";
import { competencyByCode } from "@/lib/data";
import { LEARNING } from "@/lib/profiles";
import { lessonStatuses, usePackage, useStudent } from "@/lib/useStudent";

export default function MyLearning() {
  const { s } = useStudent();
  const { pkg, fromTeacher } = usePackage();
  const [subject, setSubject] = useState<string>("math");
  const [open, setOpen] = useState<string | null>(null);
  const lessons = lessonStatuses(pkg.items, s.progress);
  const done = lessons.filter((l) => l.status === "done").length;
  const other = LEARNING.find((l) => l.id === subject);

  return (
    <div className="stagger space-y-6">
      <PageHeader icon="📘" title="My Learning" subtitle="Everything you can study, all in one place." />

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Subjects">
        {SUBJECTS.map((sub) => (
          <button key={sub.id} role="tab" aria-selected={subject === sub.id} onClick={() => { setSubject(sub.id); setOpen(null); }} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${subject === sub.id ? "bg-navy text-white shadow-soft" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-mist"}`}>
            <span aria-hidden>{sub.icon}</span>{sub.name}
          </button>
        ))}
      </div>

      {subject === "math" ? (
        <>
          <Card className="space-y-3 bg-gradient-to-r from-blue/10 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold">➗ Mathematics · {STUDENT_LABEL}</h2>
                <p className="text-sm text-slate-500">{fromTeacher ? "From your teacher's latest package" : "Sample package"} · v{pkg.version} · {done} of {lessons.length} lessons done</p>
              </div>
              <StatusChip kind="offline" label="All lessons saved offline" />
            </div>
            <ProgressBar value={lessons.length ? (done / lessons.length) * 100 : 0} color="green" label="Math progress" />
          </Card>
          <Tip>Tap a lesson to see its details: where it comes from, what you will learn and how long it takes.</Tip>
          <ul className="space-y-3">
            {lessons.map((l, k) => {
              const isOpen = open === l.lesson;
              const comp = competencyByCode(l.competencyCode);
              const steps = l.sections?.length ?? 3;
              return (
                <li key={l.lesson} className={`card overflow-hidden transition ${l.status === "progress" ? "ring-2 ring-blue/25" : ""}`}>
                  <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpen(isOpen ? null : l.lesson)} aria-expanded={isOpen}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-extrabold ${l.status === "done" ? "bg-green text-white" : l.status === "progress" ? "bg-blue text-white" : "bg-mist text-slate-500"}`}>{l.status === "done" ? "✓" : k + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{l.lesson}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500"><SourceBadge source={l.source} size="sm" />{l.minutes} min</span>
                      <span className="mt-2 block"><ProgressBar value={l.pct} color={l.pct >= 100 ? "green" : "blue"} label={l.lesson} /></span>
                    </span>
                    <span className={`text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden>⌄</span>
                  </button>
                  {isOpen && (
                    <div className="pop space-y-3 border-t border-slate-100 bg-mist/40 p-4 text-sm">
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">What you will learn</dt><dd className="font-semibold">{comp?.description ?? "Key ideas for this topic, with a quick check at the end."}</dd></div>
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Resource</dt><dd className="mt-0.5 space-y-1"><div className="font-semibold">{l.title}</div><SourceBadge source={l.source} link={l.url} /></dd></div>
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">In this lesson</dt><dd className="font-semibold">{steps} steps · about {l.minutes} minutes</dd></div>
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Saved on your device</dt><dd className="font-semibold">{l.sizeMB} MB · works offline</dd></div>
                      </dl>
                      <Link href={`/student/lesson?lesson=${encodeURIComponent(l.lesson)}`} className="btn-primary">{l.status === "done" ? "Review lesson" : l.pct > 0 ? "Continue lesson →" : "Start lesson →"}</Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        other && (
          <>
            <Card className={`space-y-2 ${other.tint}`}>
              <h2 className="text-lg font-extrabold">{other.icon} {other.name}</h2>
              <p className="text-sm text-slate-600">{other.blurb}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href={`/student/quiz?subject=${other.id}`} className="btn-primary">✏️ Take the {other.name} quiz</Link>
                <span className="text-xs text-slate-500">Lessons for this subject will arrive in a package from your teacher. The quiz works now.</span>
              </div>
            </Card>
            <div className="space-y-3">
              {other.units.map((u, i) => (
                <Card key={u.title} className="space-y-3">
                  <h3 className="font-extrabold">Unit {i + 1}: {u.title}</h3>
                  <ul className="grid gap-2 sm:grid-cols-3">
                    {u.lessons.map((t) => (
                      <li key={t} className="flex items-center gap-2 rounded-xl bg-mist px-3 py-2 text-sm font-semibold"><span aria-hidden>📄</span>{t}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}

const STUDENT_LABEL = "Grade 3";
