import { APP_NAME } from "@/lib/config";

export default function Logo({ size = "md", light = false }: { size?: "md" | "lg"; light?: boolean }) {
  const s = size === "lg" ? 44 : 32;
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="10" fill="#2563EB" />
        <path d="M9 21a8 8 0 1 1 14 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="12" r="2.6" fill="#F59E0B" />
        <path d="M8 24h16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className={`font-extrabold tracking-tight ${size === "lg" ? "text-3xl" : "text-xl"} ${light ? "text-white" : "text-navy"}`}>{APP_NAME}</span>
    </span>
  );
}
