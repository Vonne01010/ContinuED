"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { Avatar } from "@/components/extras";
import { TEACHER_PROFILE as T } from "@/lib/profiles";

const NAV = [
  { href: "/teacher", label: "Overview", icon: "▦" },
  { href: "/teacher/lesson-plan", label: "Lesson plan", icon: "☰" },
  { href: "/teacher/packages", label: "Packages", icon: "▣" },
  { href: "/teacher/server", label: "School server", icon: "◉" },
  { href: "/teacher/profile", label: "Profile", icon: "☺" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/teacher" ? path === href : path.startsWith(href));
  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_500px_at_90%_-10%,rgba(37,99,235,0.07),transparent)] bg-mist/50 md:flex">
      <aside className="flex shrink-0 flex-col bg-gradient-to-b from-navy to-[#16306f] text-white md:sticky md:top-0 md:h-screen md:w-64">
        <div className="p-4 md:p-6"><Logo light /></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition ${isActive(n.href) ? "bg-white text-navy shadow-soft" : "text-blue-100 hover:bg-white/10"}`}>
              <span className="w-5 text-center" aria-hidden>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <Link href="/teacher/profile" className="m-3 hidden items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/15 md:flex">
          <Avatar emoji={T.avatar} size={42} ring />
          <div className="min-w-0 text-sm"><div className="truncate font-extrabold">{T.display}</div><div className="truncate text-xs text-blue-200">{T.role}</div></div>
        </Link>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
