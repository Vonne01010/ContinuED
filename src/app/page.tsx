import Link from "next/link";
import Logo from "@/components/Logo";
import { TAGLINE } from "@/lib/config";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo size="lg" />
      <p className="text-lg font-semibold text-slate-600">{TAGLINE}</p>
      <div className="flex w-full flex-col gap-3">
        <Link href="/teacher/curriculum" className="btn-primary">I&apos;m a teacher</Link>
        <Link href="/student" className="btn-ghost">I&apos;m a student</Link>
      </div>
    </main>
  );
}
