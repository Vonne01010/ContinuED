"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Avatar } from "@/components/extras";
import { STUDENT_PROFILE } from "@/lib/profiles";
import { useOnline } from "@/lib/useOnline";
import { XP_PER_LEVEL, checkForPackage, levelOf, runSync, useStudent } from "@/lib/useStudent";

const NAV = [
  { href: "/student", label: "Home", icon: "🏠" },
  { href: "/student/my-learning", label: "My Learning", icon: "📘" },
  { href: "/student/quiz", label: "Practice", icon: "✏️" },
  { href: "/student/play", label: "Play", icon: "🐍" },
  { href: "/student/nearby", label: "Nearby", icon: "📡" },
  { href: "/student/offline", label: "Offline Library", icon: "📥" },
  { href: "/student/achievements", label: "Achievements", icon: "🏅" },
  { href: "/student/profile", label: "Profile", icon: "🙂" },
];
const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[4], NAV[5]];

function Connectivity({ online, ready, dark = false }: { online: boolean; ready: boolean; dark?: boolean }) {
  if (!online)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber px-3 py-1 text-xs font-extrabold text-navy">
        <span className="h-2 w-2 animate-pulse rounded-full bg-navy" />Offline mode
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${dark ? "bg-white/10 text-green-300" : "bg-green/10 text-green"}`}>
      <span className="h-2 w-2 rounded-full bg-green-400" />{ready ? "Online · Offline ready" : "Online"}
    </span>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const online = useOnline();
  const { s } = useStudent();
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const { level, into } = levelOf(s.xp);

  // Whenever we are online: download a newer package from the school server, then send queued progress.
  useEffect(() => {
    if (!online) return;
    let off = false;
    (async () => {
      const pkg = await checkForPackage();
      if (pkg && !off) setNotice(`New lessons downloaded: package v${pkg.version} (${pkg.items.length} lessons)`);
      await runSync();
    })();
    return () => { off = true; };
  }, [online]);

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
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(37,99,235,0.08),transparent),radial-gradient(800px_500px_at_0%_100%,rgba(245,158,11,0.08),transparent)] bg-mist/40 md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-navy via-navy to-[#16306f] text-white md:sticky md:top-0 md:flex md:h-screen">
        <div className="p-5"><Logo light /></div>
        <Link href="/student/profile" className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/15">
          <Avatar emoji={STUDENT_PROFILE.avatar} size={44} ring />
          <div className="min-w-0 flex-1">
            <div className="truncate font-extrabold">{STUDENT_PROFILE.nickname}</div>
            <div className="text-xs text-blue-200">Level {level} · {s.xp} XP</div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-amber" style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} /></div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${isActive(n.href) ? "bg-white text-navy shadow-soft" : "text-blue-100 hover:bg-white/10"}`}>
              <span className="text-lg" aria-hidden>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <Connectivity online={online} ready={ready} dark />
          <div className="text-xs text-blue-200">🔥 {s.streak}-day streak</div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-navy px-4 py-3 text-white shadow-lg md:hidden">
          <Logo light />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-extrabold">⚡ {s.xp}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-extrabold">🔥 {s.streak}</span>
            <Link href="/student/profile" aria-label="Profile"><Avatar emoji={STUDENT_PROFILE.avatar} size={30} ring /></Link>
          </div>
        </header>
        {!online && (
          <div className="bg-amber px-4 py-2 text-center text-sm font-bold text-navy" role="status">
            📡 You are offline. Your lessons and quizzes still work, and progress syncs when you reconnect.
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-28 md:p-8 md:pb-10">
          {notice && (
            <div className="pop flex items-center justify-between gap-3 rounded-2xl border border-green/30 bg-green/10 px-4 py-3 text-sm font-bold text-green" role="status">
              <span>✓ {notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss" className="text-green/70">✕</button>
            </div>
          )}
          {children}
        </main>
        <div className="hidden px-8 pb-6 md:block"><Connectivity online={online} ready={ready} /></div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(15,31,75,.25)] backdrop-blur md:hidden" aria-label="Main">
        {MOBILE.map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition ${isActive(n.href) ? "text-blue" : "text-slate-400"}`}>
            {isActive(n.href) && <span className="absolute -top-px h-1 w-8 rounded-b-full bg-blue" />}
            <span className={`text-xl leading-none transition ${isActive(n.href) ? "-translate-y-0.5 scale-110" : ""}`} aria-hidden>{n.icon}</span>{n.label.replace("Offline Library", "Offline").replace("My Learning", "Learn")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
