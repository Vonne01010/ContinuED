"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { TEACHER } from "@/lib/config";

const NAV = [
  { href: "/teacher", label: "Overview", icon: "▦" },
  { href: "/teacher/curriculum", label: "Curriculum", icon: "☰" },
  { href: "/teacher/packages", label: "Packages", icon: "▣" },
  { href: "/teacher/server", label: "School server", icon: "◉" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-mist/50 md:flex">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="p-4 md:p-6"><Logo /></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:pb-0">
          {NAV.map((n) => {
            const active = n.href === "/teacher" ? path === n.href : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold ${active ? "bg-blue/10 text-blue" : "text-slate-600 hover:bg-mist"}`}>
                <span className="w-5 text-center" aria-hidden>{n.icon}</span>{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 border-t border-slate-200 p-4 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-bold text-white">{TEACHER.short[0]}</div>
          <div className="text-sm"><div className="font-bold">{TEACHER.name}</div><div className="text-xs text-slate-500">{TEACHER.role}</div></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
