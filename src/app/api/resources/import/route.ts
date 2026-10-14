import { NextResponse } from "next/server";
import type { CatalogItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Basic guard so the server is not pointed at internal addresses. (Does not stop DNS rebinding.) */
function blockedHost(host: string) {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h.startsWith("[")) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return false;
}

const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

/**
 * Import resources from any public https URL that serves JSON:
 * an array (or { resources: [] }) of { title, url, source?, topic?, minutes?, summary? }.
 */
export async function POST(req: Request) {
  let url: URL;
  try {
    const body = await req.json();
    url = new URL(String(body.url));
  } catch {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }
  if (url.protocol !== "https:" || blockedHost(url.hostname)) {
    return NextResponse.json({ error: "Only public https:// URLs are allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000), redirect: "error" });
    if (!res.ok) throw new Error(`The server responded ${res.status}`);
    const text = await res.text();
    if (text.length > 1_000_000) throw new Error("File is larger than 1 MB");
    const json = JSON.parse(text);
    const list: unknown[] = Array.isArray(json) ? json : Array.isArray(json?.resources) ? json.resources : [];
    const resources: CatalogItem[] = [];
    for (const r of list.slice(0, 50) as Record<string, unknown>[]) {
      const title = typeof r?.title === "string" ? r.title.trim().slice(0, 160) : "";
      const link = typeof r?.url === "string" ? r.url : "";
      if (!title || !/^https?:\/\//.test(link)) continue;
      resources.push({
        id: `ext-${hash(link + title)}`,
        title,
        url: link.slice(0, 500),
        source: (typeof r.source === "string" && r.source.trim().slice(0, 60)) || url.hostname,
        topic: (typeof r.topic === "string" && r.topic.slice(0, 60)) || "Measurement and data",
        estimatedMinutes: Math.max(1, Math.min(120, Number(r.minutes) || 10)),
        sizeMB: Math.max(0.1, Math.min(50, Number(r.sizeMB) || 0.5)),
        summary: typeof r.summary === "string" ? r.summary.slice(0, 1200) : undefined,
        external: true,
      });
    }
    if (!resources.length) throw new Error("No valid resources found. Expected an array of { title, url }.");
    return NextResponse.json({ resources });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 502 });
  }
}
