"use client";
import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnswerCard, Button, Card, LoadingState, ProgressBar, StatusChip, XPBadge } from "@/components/ui";
import { STUDENT, SUBJECTS } from "@/lib/config";
import { QUIZZES } from "@/lib/data";
import { useOnline } from "@/lib/useOnline";
import { enqueueSync, useStudent } from "@/lib/useStudent";

type SubjectId = (typeof SUBJECTS)[number]["id"];

function Picker({ onPick, best }: { onPick: (id: SubjectId) => void; best: Record<string, number> }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">Practice</h1>
        <p className="text-slate-500">Pick a subject. Each quiz has 5 questions and works without internet.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {SUBJECTS.map((sub) => (
          <button key={sub.id} onClick={() => onPick(sub.id)} className="card flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-blue/40">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${sub.tint}`} aria-hidden>{sub.icon}</span>
            <span>
              <span className="block text-lg font-extrabold">{sub.name}</span>
              <span className="block text-sm text-slate-500">{best[sub.id] !== undefined ? `Best: ${best[sub.id]}%` : "5 questions"}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Quiz({ subject, onExit }: { subject: SubjectId; onExit: () => void }) {
  const { s, addXp, addMinutes, addBadge, recordQuiz } = useStudent();
  const online = useOnline();
  const questions = QUIZZES[subject];
  const subjectName = SUBJECTS.find((x) => x.id === subject)?.name ?? "";
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earned, setEarned] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(Date.now());
  const wasOffline = useRef(false);

  const q = questions[i];
  const isCorrect = checked && sel === q.correct;

  function check() {
    if (sel === null || checked) return;
    if (!online) wasOffline.current = true;
    setChecked(true);
    if (sel === q.correct) {
      setCorrect((c) => c + 1);
      addXp(10);
    }
  }

  function next() {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setSel(null);
      setChecked(false);
      return;
    }
    const secs = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    setSeconds(secs);
    const badges: string[] = [];
    if (correctCount >= 4 && !s.badges.includes("Sharp Mind")) badges.push("Sharp Mind");
    if (wasOffline.current && !s.badges.includes("Offline Learner")) badges.push("Offline Learner");
    badges.forEach(addBadge);
    setEarned(badges);
    recordQuiz(subject, Math.round((correctCount / questions.length) * 100));
    addMinutes(Math.max(1, Math.round(secs / 60)));
    enqueueSync({ kind: "quiz", subject, label: `${subjectName} quiz · ${correctCount}/${questions.length} correct`, xp: correctCount * 10, correct: correctCount, total: questions.length });
    setFinished(true);
  }

  function again() {
    setI(0); setSel(null); setChecked(false); setCorrect(0); setFinished(false); setEarned([]);
    startedAt.current = Date.now();
    wasOffline.current = false;
  }

  if (finished) {
    const acc = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="mx-auto max-w-xl space-y-5 text-center">
        <Card className="pop space-y-4 p-8">
          <div className="text-5xl" aria-hidden>🎉</div>
          <h1 className="text-3xl font-extrabold">Nice work, {STUDENT.name}! 🎉</h1>
          <p className="text-slate-500">{subjectName} quiz</p>
          <div className="flex justify-center"><XPBadge xp={correctCount * 10} className="text-lg" /></div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-mist p-3"><div className="text-2xl font-extrabold">{correctCount}/{questions.length}</div><div className="text-slate-500">correct</div></div>
            <div className="rounded-2xl bg-mist p-3"><div className="text-2xl font-extrabold">{acc}%</div><div className="text-slate-500">accuracy</div></div>
            <div className="rounded-2xl bg-mist p-3"><div className="text-2xl font-extrabold">{seconds}s</div><div className="text-slate-500">time</div></div>
          </div>
          {earned.map((b) => <div key={b} className="pop rounded-xl bg-amber/15 px-4 py-2 font-extrabold text-amber-700">🏅 New badge: {b}</div>)}
          <div className="flex justify-center"><StatusChip kind="waiting" label={online ? "Saved · syncing to your teacher" : "Saved on this device · Waiting to Sync"} /></div>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/student" className="btn-primary">Continue Learning</Link>
          <Link href="/student" className="btn-ghost">Back to Home</Link>
          <Button variant="secondary" onClick={again}>Try again</Button>
          <Button variant="secondary" onClick={onExit}>Other subjects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">{subjectName} Quiz</h1>
          <span className="text-sm font-bold text-slate-500">Question {i + 1} of {questions.length}</span>
        </div>
        <ProgressBar value={((i + (checked ? 1 : 0)) / questions.length) * 100} label="Quiz progress" />
        <button onClick={onExit} className="text-xs font-bold text-blue">← Change subject</button>
      </header>

      <Card><h2 className="text-xl font-bold leading-snug md:text-2xl">{q.question}</h2></Card>

      <div className="space-y-3" role="group" aria-label="Answer choices">
        {q.options.map((o, idx) => {
          let state: "idle" | "selected" | "correct" | "wrong" | "dim" = sel === idx ? "selected" : "idle";
          if (checked) state = idx === q.correct ? "correct" : sel === idx ? "wrong" : "dim";
          return <AnswerCard key={idx} letter={"ABCD"[idx]} text={o} state={state} disabled={checked} onClick={() => setSel(idx)} />;
        })}
      </div>

      {checked && (
        <div role="status" className={`pop rounded-2xl border p-4 ${isCorrect ? "border-green/30 bg-green/10" : "border-danger/30 bg-danger/5"}`}>
          <div className={`font-extrabold ${isCorrect ? "text-green" : "text-danger"}`}>{isCorrect ? "✓ Correct! +10 XP" : "Not quite. That's okay, learning is practice."}</div>
          <p className="mt-1 text-sm text-slate-700">{q.explanation}</p>
        </div>
      )}

      {checked ? (
        <Button className="w-full py-3.5 text-base" onClick={next}>{i + 1 >= questions.length ? "See results" : "Next Question"}</Button>
      ) : (
        <Button className="w-full py-3.5 text-base" disabled={sel === null} onClick={check}>Check Answer</Button>
      )}
    </div>
  );
}

function PracticeInner() {
  const params = useSearchParams().get("subject");
  const initial = SUBJECTS.find((x) => x.id === params)?.id ?? null;
  const [subject, setSubject] = useState<SubjectId | null>(initial);
  const { s } = useStudent();
  return subject ? <Quiz key={subject} subject={subject} onExit={() => setSubject(null)} /> : <Picker onPick={setSubject} best={s.quizBest} />;
}

export default function Practice() {
  return (
    <Suspense fallback={<LoadingState label="Loading practice…" />}>
      <PracticeInner />
    </Suspense>
  );
}
