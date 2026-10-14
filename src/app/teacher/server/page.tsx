"use client";
import { seedPackages } from "@/lib/data";
import { useStored } from "@/lib/useStored";
import type { Pkg } from "@/lib/types";

const devices = [
  ["Tablet-G3-01", "Online", "2 min ago"],
  ["Tablet-G3-02", "Online", "5 min ago"],
  ["Laptop-Library", "Online", "1 min ago"],
  ["Phone-Kid-A", "Idle", "3 h ago"],
  ["Phone-Kid-B", "Offline", "Yesterday"],
];

export default function SchoolServer() {
  const [packages] = useStored<Pkg[]>("continued.packages", seedPackages);
  const used = Math.round((packages.reduce((s, p) => s + p.sizeMB, 0) + 412) * 10) / 10;
  const last = [...packages].reverse().find((p) => p.synced);
  const cards = [
    ["Status", "● Online", "text-green"],
    ["Last sync", last ? new Date(last.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—", "text-navy"],
    ["Storage used", `${used} MB / 32 GB`, "text-navy"],
    ["Connected devices", "24", "text-navy"],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">School server</h1>
        <p className="text-sm text-slate-500">Mock data — a Raspberry Pi–style box in the school library that serves packages over local Wi-Fi.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v, t]) => (
          <div key={l} className="card p-5"><div className="text-sm text-slate-500">{l}</div><div className={`mt-1 text-xl font-extrabold ${t}`}>{v}</div></div>
        ))}
      </div>
      <section className="card p-5">
        <h2 className="mb-3 font-bold text-navy">Devices</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {devices.map(([n, s, t]) => (
            <li key={n} className="flex items-center justify-between py-2.5">
              <span className="font-semibold">{n}</span>
              <span className="text-slate-400">{t}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s === "Online" ? "bg-green/10 text-green" : s === "Idle" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{s}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
