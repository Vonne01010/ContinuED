"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnswerCard, Button, Card, ProgressBar, StatusChip, XPBadge } from "@/components/ui";
import { STUDENT } from "@/lib/config";
import { QUIZ } from "@/lib/data";
import { useOnline } from "@/lib/useOnline";
import { useStudent, useSyncQueue } from "@/lib/useStudent";

export default function Quiz() {
  const { s, addXp, addMinutes, addBadge, recordQuiz } = useStudent();
  const { enqueue } = useSyncQueue();
  const online = useOnline();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earned, setEarned] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(Date.now());
  const wasOffline = useRef(false);

  const q = QUIZ[i];
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
    if (i + 1 < QUIZ.length) {
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
    recordQuiz(correctCount);
    addMinutes(Math.max(1, Math.round(secs / 60)));
    enqueue({ kind: "quiz", label: `Math quiz · ${correctCount}/${QUIZ.length} correct`, xp: correctCount * 10 });
    setFinished(true);
  }

  function again() {
    setI(0); setSel(null); setChecked(false); setCorrect(0); setFinished(false); setEarned([]);
    startedAt.current = Date.now();
    wasOffline.current = false;
  }

  if (finished) {
    const acc = Math.round((correctCount / QUIZ.length) * 100);
    return (
      <div className="mx-auto max-w-xl space-y-5 text-center">
        <Card className="pop space-y-4 p-8">
          <div className="text-5xl" aria-hidden>🎉</div>
          <h1 className="text-3xl font-extrabold">Nice work, {STUDENT.name}! 🎉</h1>
          <div className="flex justify-center"><XPBadge xp={correctCount * 10} className="text-lg" /></div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-mist p-3"><div className="text-2xl font-extrabold">{correctCount}/{QUIZ.length}</div><div className="text-slate-500">correct</div></div>
            <div className="rounded-2xl bg-mist p-3"><div className="text-2xl font-extrabold">{acc}%</div><div className="text-slate-500">accuracy</div></div>
            <div className="rounded-2xl bg-mist p-3"><div className="text-2xl font-extrabold">{seconds}s</div><div className="text-slate-500">time</div></div>
          </div>
          {earned.map((b) => <div key={b} className="pop rounded-xl bg-amber/15 px-4 py-2 font-extrabold text-amber-700">🏅 New badge: {b}</div>)}
          <div className="flex justify-center"><StatusChip kind="waiting" label={online ? "Saved · sync from Offline Library" : "Saved on this device · Waiting to Sync"} /></div>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/student" className="btn-primary">Continue Learning</Link>
          <Link href="/student" className="btn-ghost">Back to Home</Link>
          <Button variant="secondary" onClick={again}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Practice Quiz · Mathematics</h1>
          <span className="text-sm font-bold text-slate-500">Question {i + 1} of {QUIZ.length}</span>
        </div>
        <ProgressBar value={((i + (checked ? 1 : 0)) / QUIZ.length) * 100} label="Quiz progress" />
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
        <Button className="w-full py-3.5 text-base" onClick={next}>{i + 1 >= QUIZ.length ? "See results" : "Next Question"}</Button>
      ) : (
        <Button className="w-full py-3.5 text-base" disabled={sel === null} onClick={check}>Check Answer</Button>
      )}
    </div>
  );
}
