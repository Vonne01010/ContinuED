"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { STUDENT } from "@/lib/config";
import { useOnline } from "@/lib/useOnline";

const NAV = [
  { href: "/student", label: "Home", icon: "🏠" },
  { href: "/student/my-learning", label: "My Learning", icon: "📘" },
  { href: "/student/quiz", label: "Practice", icon: "✏️" },
  { href: "/student/offline", label: "Offline Library", icon: "📥" },
  { href: "/student/achievements", label: "Achievements", icon: "🏅" },
  { href: "/student/profile", label: "Profile", icon: "🙂" },
];
const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[3]];

function Connectivity({ online, ready }: { online: boolean; ready: boolean }) {
  if (!online) return <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white"><span className="h-2 w-2 rounded-full bg-amber" />Offline</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">
      <span className="h-2 w-2 rounded-full bg-green" />{ready ? "Online · Offline ready" : "Online"}
    </span>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const online = useOnline();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then(async () => {
        // Poll until the service worker has finished precaching the student routes.
        for (let i = 0; i < 60 && !cancelled; i++) {
          if (await caches.match("/student/profile")) {
            setReady(true);
            return;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, []);

  const isActive = (href: string) => (href === "/student" ? path === href : path.startsWith(href));

  return (
    <div className="min-h-screen bg-mist/40 md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen">
        <div className="p-5"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${isActive(n.href) ? "bg-blue/10 text-blue" : "text-slate-600 hover:bg-mist"}`}>
              <span aria-hidden>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-slate-200 p-4">
          <Connectivity online={online} ready={ready} />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber font-extrabold text-white">{STUDENT.name[0]}</div>
            <div className="text-sm"><div className="font-bold">{STUDENT.name}</div><div className="text-xs text-slate-500">{STUDENT.grade}</div></div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <Connectivity online={online} ready={ready} />
        </header>
        <main className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-28 md:p-8 md:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Main">
        {MOBILE.map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ${isActive(n.href) ? "text-blue" : "text-slate-400"}`}>
            <span className="text-xl leading-none" aria-hidden>{n.icon}</span>{n.label.replace("Offline Library", "Offline")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
