import type { ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const SOURCES: Record<string, { cls: string; mark: string }> = {
  "Khan Academy": { cls: "bg-green/10 text-green-800 ring-green/30", mark: "K" },
  "Schoolhouse.world": { cls: "bg-violet-100 text-violet-800 ring-violet-300", mark: "S" },
  "CK-12": { cls: "bg-orange-100 text-orange-800 ring-orange-300", mark: "C" },
  "BBC Bitesize": { cls: "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-300", mark: "B" },
  "Crash Course": { cls: "bg-red-100 text-red-800 ring-red-300", mark: "CC" },
  "Simple English Wikipedia": { cls: "bg-slate-100 text-slate-800 ring-slate-300", mark: "W" },
};

/** Readable lesson source: colored mark plus the full source name in normal-size text. */
export function SourceBadge({ source, size = "md", link, onDark }: { source: string; size?: "sm" | "md"; link?: string; onDark?: boolean }) {
  const base = SOURCES[source] ?? { cls: "bg-blue/10 text-blue ring-blue/30", mark: (source[0] ?? "?").toUpperCase() };
  const s = onDark ? { ...base, cls: "bg-white text-navy ring-white" } : base;
  const body = (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full font-bold ring-1", s.cls, size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm")}>
      <span className={cx("flex items-center justify-center rounded-full bg-white/70 font-extrabold", size === "sm" ? "h-4 min-w-4 px-0.5 text-[9px]" : "h-5 min-w-5 px-1 text-[10px]")} aria-hidden>{s.mark}</span>
      {source}
      {link && <span aria-hidden>↗</span>}
    </span>
  );
  return link ? (
    <a href={link} target="_blank" rel="noreferrer" className="hover:opacity-80" title={`Open on ${source} (needs internet)`}>{body}</a>
  ) : (
    body
  );
}

export function Avatar({ emoji, size = 40, ring = false }: { emoji: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={cx("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber/30 to-blue/20 leading-none", ring && "ring-2 ring-white")}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

export function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue to-navy text-2xl shadow-soft" aria-hidden>{icon}</span>}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 md:text-base">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
  );
}

/** Small explanatory hint card used to guide first-time users. */
export function Tip({ icon = "💡", children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue/20 bg-gradient-to-r from-blue/5 to-transparent p-3 text-sm text-slate-700">
      <span className="text-lg" aria-hidden>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

export function StatTile({ icon, label, value, hint, tone = "blue" }: { icon: string; label: string; value: ReactNode; hint?: string; tone?: "blue" | "amber" | "green" | "navy" }) {
  const t = { blue: "from-blue/15 to-blue/0 text-blue", amber: "from-amber/25 to-amber/0 text-amber-700", green: "from-green/15 to-green/0 text-green", navy: "from-navy/10 to-navy/0 text-navy" }[tone];
  return (
    <div className={cx("card relative overflow-hidden bg-gradient-to-br p-4", t)}>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><span aria-hidden>{icon}</span>{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
