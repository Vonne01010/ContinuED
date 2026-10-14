"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SourceBadge } from "@/components/extras";
import { AnswerCard, Button, Card, EmptyState, LoadingState, ProgressBar, StatusChip } from "@/components/ui";
import { competencyByCode, sectionsFor } from "@/lib/data";
import { enqueueSync, lessonStatuses, usePackage, useStudent } from "@/lib/useStudent";

function Reader() {
  const lessonTitle = useSearchParams().get("lesson") ?? "";
  const { s, addXp, addMinutes, setProgress, addBadge } = useStudent();
  const { pkg } = usePackage();
  const item = pkg.items.find((i) => i.lesson === lessonTitle);

  const [idx, setIdx] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  const sections = item ? item.sections ?? sectionsFor(item, item.summary) : [];
  const n = sections.length;
  const startPct = item ? s.progress[item.lesson] ?? 0 : 0;

  // Resume where the student left off (or review from the start if already done).
  useEffect(() => {
    if (idx === null && item) setIdx(startPct >= 100 ? 0 : Math.min(n - 1, Math.round((startPct / 100) * n)));
  }, [idx, item, n, startPct]);

  if (!item) return <EmptyState icon="🔎" title="Lesson not found" body="This lesson is not in your downloaded package." action={<Link href="/student" className="btn-primary">Back to Home</Link>} />;
  if (idx === null) return <LoadingState label="Opening lesson…" />;

  const wasDone = startPct >= 100;
  const sec = sections[idx];
  const next = lessonStatuses(pkg.items, s.progress).find((l) => l.status === "progress" && l.lesson !== item.lesson);

  function advance(xp = 0) {
    if (!item) return;
    const donePct = Math.round(((idx! + 1) / n) * 100);
    if (!wasDone) {
      setProgress(item.lesson, Math.max(donePct, startPct));
      addMinutes(Math.max(1, Math.round(item.minutes / n)));
    }
    if (xp && !wasDone) addXp(xp);
    setSel(null);
    setChecked(false);
    if (idx! + 1 >= n) {
      if (!wasDone) {
        addXp(15);
        addBadge("Lesson Learner");
        enqueueSync({ kind: "lesson", subject: "math", label: `Completed lesson: ${item.lesson}`, xp: 15 });
      }
      setFinished(true);
    } else {
      setIdx(idx! + 1);
    }
  }

  if (finished)
    return (
      <div className="mx-auto max-w-xl space-y-5 text-center">
        <Card className="pop space-y-3 p-8">
          <div className="text-5xl" aria-hidden>🎉</div>
          <h1 className="text-2xl font-extrabold">Lesson complete!</h1>
          <p className="text-slate-600">{item.lesson}</p>
          {!wasDone && <div className="inline-block rounded-full bg-amber/15 px-4 py-1.5 font-extrabold text-amber-700">⚡ +15 XP</div>}
          <div className="flex justify-center"><StatusChip kind="waiting" label="Saved on this device · syncs when online" /></div>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {next && <Link href={`/student/lesson?lesson=${encodeURIComponent(next.lesson)}`} className="btn-primary">Next lesson →</Link>}
          <Link href="/student/quiz" className="btn-ghost">Take a practice quiz</Link>
          <Link href="/student" className="btn-ghost">Back to Home</Link>
        </div>
      </div>
    );

  const competency = competencyByCode(item.competencyCode);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <Link href="/student" className="text-sm font-bold text-blue">← Home</Link>
        <h1 className="text-2xl font-extrabold leading-tight">{item.lesson}</h1>
        <div className="flex items-center justify-between text-sm font-bold text-slate-500">
          <span>Step {idx + 1} of {n}</span>
          <span className="flex items-center gap-2">{item.minutes} min <SourceBadge source={item.source} size="sm" /></span>
        </div>
        <ProgressBar value={(idx / n) * 100} label="Lesson progress" />
      </header>

      {sec.kind === "read" ? (
        <>
          <Card className="space-y-2">
            <h2 className="text-lg font-extrabold">{sec.title}</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{sec.body}</p>
          </Card>
          <Button className="w-full py-3.5 text-base" onClick={() => advance()}>{idx + 1 >= n ? "Finish lesson" : "Got it, next →"}</Button>
        </>
      ) : (
        <>
          <Card><div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-blue">Try it</div><h2 className="text-xl font-bold leading-snug">{sec.question}</h2></Card>
          <div className="space-y-3" role="group" aria-label="Answer choices">
            {sec.options.map((o, k) => {
              let state: "idle" | "selected" | "correct" | "wrong" | "dim" = sel === k ? "selected" : "idle";
              if (checked) state = k === sec.correct ? "correct" : sel === k ? "wrong" : "dim";
              return <AnswerCard key={k} letter={"ABCD"[k]} text={o} state={state} disabled={checked} onClick={() => setSel(k)} />;
            })}
          </div>
          {checked && (
            <div role="status" className={`pop rounded-2xl border p-4 ${sel === sec.correct ? "border-green/30 bg-green/10" : "border-danger/30 bg-danger/5"}`}>
              <div className={`font-extrabold ${sel === sec.correct ? "text-green" : "text-danger"}`}>{sel === sec.correct ? "✓ Correct! +5 XP" : "Not quite. Learning is practice."}</div>
              <p className="mt-1 text-sm text-slate-700">{sec.explanation}</p>
            </div>
          )}
          {checked ? (
            <Button className="w-full py-3.5 text-base" onClick={() => advance(sel === sec.correct ? 5 : 0)}>{idx + 1 >= n ? "Finish lesson" : "Continue →"}</Button>
          ) : (
            <Button className="w-full py-3.5 text-base" disabled={sel === null} onClick={() => setChecked(true)}>Check Answer</Button>
          )}
        </>
      )}

      <p className="text-xs text-slate-400">
        {competency ? `DepEd competency ${item.competencyCode}: ${competency.description} · ` : ""}
        {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="font-bold text-blue">Open the full resource on {item.source} ↗ (needs internet)</a>}
      </p>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={<LoadingState label="Opening lesson…" />}>
      <Reader />
    </Suspense>
  );
}
