"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { PageHeader, Tip } from "@/components/extras";
import { enqueueSync, useStudent } from "@/lib/useStudent";

const N = 12;
const CELL = 30;
const GOAL = 8;
type P = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type Tile = P & { v: number; ok: boolean };
type Question = { text: string; answer: number };
type Phase = "ready" | "playing" | "over" | "won";

const VEC: Record<Dir, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPP: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const COLORS = ["#2563EB", "#F59E0B", "#16A34A", "#EF4444"];

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

function makeQuestion(): Question {
  const k = Math.random();
  if (k < 0.5) {
    const a = rnd(2, 9), b = rnd(2, 9);
    return { text: `${a} × ${b} = ?`, answer: a * b };
  }
  if (k < 0.75) {
    const a = rnd(11, 60), b = rnd(11, 39);
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }
  const b = rnd(2, 9), q = rnd(2, 9);
  return { text: `${b * q} ÷ ${b} = ?`, answer: q };
}

export default function MathSnake() {
  const { s, addXp, addMinutes, addBadge } = useStudent();
  const canvas = useRef<HTMLCanvasElement>(null);
  const g = useRef({
    snake: [] as P[],
    dir: "right" as Dir,
    next: "right" as Dir,
    tiles: [] as Tile[],
    q: { text: "", answer: 0 } as Question,
    lives: 3,
    correct: 0,
    phase: "ready" as Phase,
    flash: "" as "" | "good" | "bad",
    timer: null as ReturnType<typeof setInterval> | null,
  });
  const [ui, setUi] = useState({ q: "Get ready!", lives: 3, correct: 0, phase: "ready" as Phase, xp: 0 });
  const [msg, setMsg] = useState("");
  const touch = useRef<P | null>(null);

  const sync = useCallback((phase?: Phase, xp = 0) => {
    const st = g.current;
    setUi((u) => ({ q: st.q.text || u.q, lives: st.lives, correct: st.correct, phase: phase ?? st.phase, xp }));
  }, []);

  const occupied = (p: P) => g.current.snake.some((c) => c.x === p.x && c.y === p.y) || g.current.tiles.some((t) => t.x === p.x && t.y === p.y);

  const spawn = useCallback(() => {
    const st = g.current;
    st.q = makeQuestion();
    const wrong = new Set<number>();
    while (wrong.size < 2) {
      const w = st.q.answer + rnd(-6, 6);
      if (w > 0 && w !== st.q.answer) wrong.add(w);
    }
    st.tiles = [];
    for (const [v, ok] of [[st.q.answer, true], ...[...wrong].map((w) => [w, false])] as [number, boolean][]) {
      let p: P;
      let tries = 0;
      do {
        p = { x: rnd(0, N - 1), y: rnd(0, N - 1) };
        tries++;
      } while ((occupied(p) || Math.hypot(p.x - st.snake[0].x, p.y - st.snake[0].y) < 3) && tries < 200);
      st.tiles.push({ ...p, v, ok });
    }
  }, []);

  const resetSnake = () => {
    const st = g.current;
    st.snake = [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }];
    st.dir = st.next = "right";
  };

  const draw = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const st = g.current;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#EAF1FF" : "#F4F8FF";
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
    if (st.flash) {
      ctx.fillStyle = st.flash === "good" ? "rgba(22,163,74,.25)" : "rgba(239,68,68,.25)";
      ctx.fillRect(0, 0, N * CELL, N * CELL);
    }
    st.tiles.forEach((t, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      ctx.roundRect(t.x * CELL + 1, t.y * CELL + 1, CELL - 2, CELL - 2, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${t.v > 99 ? 12 : 15}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(t.v), t.x * CELL + CELL / 2, t.y * CELL + CELL / 2 + 1);
    });
    st.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#0F1F4B" : `hsl(${150 - i * 4}, 65%, ${42 + Math.min(i, 8)}%)`;
      ctx.beginPath();
      ctx.roundRect(p.x * CELL + 2, p.y * CELL + 2, CELL - 4, CELL - 4, i === 0 ? 10 : 8);
      ctx.fill();
      if (i === 0) {
        ctx.fillStyle = "#fff";
        const v = VEC[st.dir];
        for (const o of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(p.x * CELL + CELL / 2 + v.x * 4 + (v.y !== 0 ? o * 5 : 0), p.y * CELL + CELL / 2 + v.y * 4 + (v.x !== 0 ? o * 5 : 0), 3, 0, 7);
          ctx.fill();
        }
      }
    });
  }, []);

  const stop = () => {
    if (g.current.timer) clearInterval(g.current.timer);
    g.current.timer = null;
  };

  const finish = useCallback((won: boolean) => {
    const st = g.current;
    stop();
    st.phase = won ? "won" : "over";
    const xp = st.correct * 5 + (won ? 10 : 0);
    if (xp > 0) addXp(xp);
    addMinutes(1);
    if (st.correct >= 6) addBadge("Snake Charmer");
    enqueueSync({ kind: "game", subject: "math", label: `Math Snake · ${st.correct}/${GOAL} correct`, xp, correct: st.correct, total: GOAL });
    sync(st.phase, xp);
  }, [addXp, addMinutes, addBadge, sync]);

  const tick = useCallback(() => {
    const st = g.current;
    if (st.phase !== "playing") return;
    st.dir = st.next;
    const v = VEC[st.dir];
    const head = { x: (st.snake[0].x + v.x + N) % N, y: (st.snake[0].y + v.y + N) % N };
    const hit = st.tiles.find((t) => t.x === head.x && t.y === head.y);
    if (st.snake.some((c, i) => i < st.snake.length - 1 && c.x === head.x && c.y === head.y)) {
      st.lives--;
      st.flash = "bad";
      setMsg("Oops, you bumped into yourself!");
      setTimeout(() => (st.flash = ""), 250);
      if (st.lives <= 0) return finish(false);
      resetSnake();
      sync();
      return draw();
    }
    st.snake.unshift(head);
    if (hit?.ok) {
      st.correct++;
      st.flash = "good";
      setMsg("Correct! 🎉");
      setTimeout(() => (st.flash = ""), 250);
      if (st.correct >= GOAL) {
        draw();
        return finish(true);
      }
      spawn();
      sync();
      stop();
      st.timer = setInterval(tick, Math.max(110, 200 - st.correct * 12));
    } else if (hit) {
      st.lives--;
      st.flash = "bad";
      setMsg(`Not ${hit.v}. Look at the question again.`);
      setTimeout(() => (st.flash = ""), 250);
      st.snake.pop();
      st.tiles = st.tiles.filter((t) => t !== hit);
      if (st.lives <= 0) return finish(false);
      sync();
    } else {
      st.snake.pop();
    }
    draw();
  }, [draw, finish, spawn, sync]);

  const start = () => {
    const st = g.current;
    stop();
    st.lives = 3;
    st.correct = 0;
    st.phase = "playing";
    st.flash = "";
    resetSnake();
    spawn();
    setMsg("Steer the snake to the right answer.");
    sync("playing");
    draw();
    st.timer = setInterval(tick, 200);
  };

  const turn = useCallback((d: Dir) => {
    const st = g.current;
    if (d !== OPP[st.dir]) st.next = d;
  }, []);

  useEffect(() => {
    resetSnake();
    spawn();
    draw();
    const keys: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault();
      turn(d);
    };
    const onHide = () => document.hidden && g.current.phase === "playing" && (stop(), (g.current.phase = "ready"), sync("ready"));
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      stop();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [draw, spawn, sync, turn]);

  const onPointerUp = (e: React.PointerEvent) => {
    const t0 = touch.current;
    touch.current = null;
    if (!t0) return;
    const dx = e.clientX - t0.x, dy = e.clientY - t0.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  const playing = ui.phase === "playing";

  return (
    <div className="stagger mx-auto max-w-xl space-y-5">
      <PageHeader icon="🐍" title="Math Snake" subtitle="Eat the correct answer. Learn your facts while you play." />

      <Card className="space-y-3 !p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="rounded-2xl bg-navy px-4 py-2 text-xl font-extrabold text-white" aria-live="polite">{ui.q}</div>
          <div className="text-right text-sm font-bold">
            <div aria-label={`${ui.lives} lives`}>{"❤️".repeat(ui.lives)}{"🖤".repeat(3 - ui.lives)}</div>
            <div className="text-slate-500">{ui.correct}/{GOAL} correct</div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[420px]">
          <canvas ref={canvas} width={N * CELL} height={N * CELL} className="w-full touch-none rounded-2xl ring-2 ring-slate-200" onPointerDown={(e) => (touch.current = { x: e.clientX, y: e.clientY })} onPointerUp={onPointerUp} aria-label="Math Snake game board" />
          {!playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-navy/85 p-4 text-center text-white backdrop-blur-sm">
              {ui.phase === "ready" && <><div className="text-4xl">🐍</div><div className="font-extrabold">Ready?</div><p className="text-sm text-blue-100">Use arrow keys, swipe, or the buttons. Eat the number that answers the question. Wrong numbers cost a heart.</p></>}
              {ui.phase === "won" && <><div className="text-4xl">🏆</div><div className="text-xl font-extrabold">You won!</div><p className="text-sm text-blue-100">{ui.correct} correct · +{ui.xp} XP</p></>}
              {ui.phase === "over" && <><div className="text-4xl">💪</div><div className="text-xl font-extrabold">Good try!</div><p className="text-sm text-blue-100">{ui.correct} correct · +{ui.xp} XP</p></>}
              <button onClick={start} className="btn bg-amber px-6 py-3 font-extrabold text-navy hover:bg-amber-400">{ui.phase === "ready" ? "▶ Play" : "Play again"}</button>
            </div>
          )}
        </div>

        <div className="mx-auto grid w-40 grid-cols-3 gap-1.5 md:hidden" aria-label="Controls">
          <span />
          <button className="btn-ghost !p-3 text-xl" onClick={() => turn("up")} aria-label="Up">▲</button>
          <span />
          <button className="btn-ghost !p-3 text-xl" onClick={() => turn("left")} aria-label="Left">◀</button>
          <button className="btn-ghost !p-3 text-xl" onClick={() => turn("down")} aria-label="Down">▼</button>
          <button className="btn-ghost !p-3 text-xl" onClick={() => turn("right")} aria-label="Right">▶</button>
        </div>
        <p className="min-h-5 text-center text-sm font-semibold text-slate-600" role="status">{msg}</p>
      </Card>

      <Tip icon="⚡">Earn 5 XP for every correct answer, plus 10 bonus XP if you reach {GOAL}. It works offline, and your score syncs to your teacher later.</Tip>
      <div className="text-center"><span className="text-sm text-slate-500">Your XP: {s.xp} · </span><Link href="/student/quiz" className="text-sm font-bold text-blue">Try a quiz →</Link></div>
      {!playing && ui.phase !== "ready" && <div className="text-center"><Button variant="secondary" onClick={start}>Play again</Button></div>}
    </div>
  );
}
