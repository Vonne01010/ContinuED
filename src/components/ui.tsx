import type { ButtonHTMLAttributes, ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return <button {...p} className={cx(variant === "primary" ? "btn-primary" : "btn-ghost", className)} />;
}

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "li" }) {
  return <Tag className={cx("card p-5", className)}>{children}</Tag>;
}

export function ProgressBar({ value, color = "blue", label }: { value: number; color?: "blue" | "green" | "amber"; label?: string }) {
  const bg = { blue: "bg-blue", green: "bg-green", amber: "bg-amber" }[color];
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("h-full rounded-full transition-all duration-500", bg)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function CircularProgress({ value, size = 96, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F8" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center text-sm font-extrabold">{children}</div>
    </div>
  );
}

export type ChipKind = "offline" | "waiting" | "syncing" | "needsNet" | "synced";
const CHIPS: Record<ChipKind, { label: string; cls: string; icon: string }> = {
  offline: { label: "Available Offline", cls: "bg-green/10 text-green", icon: "✓" },
  waiting: { label: "Waiting to Sync", cls: "bg-amber/15 text-amber-700", icon: "⏳" },
  syncing: { label: "Syncing", cls: "bg-blue/10 text-blue", icon: "↻" },
  needsNet: { label: "Needs Internet", cls: "bg-mist text-slate-600", icon: "☁" },
  synced: { label: "Synced", cls: "bg-green/10 text-green", icon: "✓" },
};
export function StatusChip({ kind, label }: { kind: ChipKind; label?: string }) {
  const c = CHIPS[kind];
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", c.cls)}>
      <span aria-hidden className={kind === "syncing" ? "inline-block animate-spin" : ""}>{c.icon}</span>
      {label ?? c.label}
    </span>
  );
}

export function XPBadge({ xp, className }: { xp: number; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full bg-amber/15 px-3 py-1 text-sm font-extrabold text-amber-700", className)}>⚡ {xp.toLocaleString()} XP</span>;
}

export function StreakBadge({ days }: { days: number }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-extrabold text-orange-600">🔥 {days}-day streak</span>;
}

export function SubjectCard({ name, icon, lessons, progress, active, tint }: { name: string; icon: string; lessons: number; progress: number; active?: boolean; tint: string }) {
  return (
    <div className={cx("card flex flex-col gap-3 p-4", !active && "opacity-80")}>
      <div className="flex items-center justify-between">
        <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl text-xl", tint)} aria-hidden>{icon}</span>
        {!active && <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-bold text-slate-500">Coming soon</span>}
      </div>
      <div>
        <div className="font-extrabold">{name}</div>
        <div className="text-xs text-slate-500">{lessons} lessons · {progress}%</div>
      </div>
      <ProgressBar value={progress} color={active ? "blue" : "green"} label={`${name} progress`} />
    </div>
  );
}

export function LessonCard({ title, meta, chips, progress, right }: { title: string; meta: string; chips?: ReactNode; progress?: number; right?: ReactNode }) {
  return (
    <li className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold leading-snug">{title}</div>
          <div className="mt-0.5 text-xs text-slate-500">{meta}</div>
        </div>
        {right}
      </div>
      {progress !== undefined && <ProgressBar value={progress} color={progress >= 100 ? "green" : "blue"} label={title} />}
      {chips && <div className="flex flex-wrap gap-2">{chips}</div>}
    </li>
  );
}

export function AnswerCard({ letter, text, state, onClick, disabled }: { letter: string; text: string; state: "idle" | "selected" | "correct" | "wrong" | "dim"; onClick: () => void; disabled?: boolean }) {
  const styles = {
    idle: "border-slate-200 bg-white hover:border-blue/50 hover:bg-mist/60",
    selected: "border-blue bg-blue/5 ring-2 ring-blue/30",
    correct: "border-green bg-green/10 ring-2 ring-green/30",
    wrong: "border-danger bg-danger/10 ring-2 ring-danger/30",
    dim: "border-slate-200 bg-white opacity-60",
  }[state];
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={state === "selected"} className={cx("flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold transition", styles)}>
      <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", state === "correct" ? "bg-green text-white" : state === "wrong" ? "bg-danger text-white" : state === "selected" ? "bg-blue text-white" : "bg-mist text-slate-500")}>
        {state === "correct" ? "✓" : state === "wrong" ? "✕" : letter}
      </span>
      {text}
    </button>
  );
}

export function EmptyState({ icon = "📭", title, body, action }: { icon?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 text-center">
      <div className="text-4xl" aria-hidden>{icon}</div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {body && <p className="max-w-sm text-sm text-slate-500">{body}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-mist border-t-blue" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body, action }: { title?: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center" role="alert">
      <div className="text-3xl" aria-hidden>⚠️</div>
      <h2 className="font-extrabold">{title}</h2>
      {body && <p className="max-w-sm text-sm text-slate-600">{body}</p>}
      {action}
    </div>
  );
}
