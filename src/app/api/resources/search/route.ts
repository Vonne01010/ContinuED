import { NextResponse } from "next/server";
import type { CatalogItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Look up learning resources from outside: Simple English Wikipedia (free, no key). */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const topic = (params.get("topic") ?? "").slice(0, 60);
  if (q.length < 2) return NextResponse.json({ error: "Type at least 2 characters" }, { status: 400 });
  try {
    const api = new URL("https://simple.wikipedia.org/w/api.php");
    api.search = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: q,
      gsrlimit: "6",
      gsrnamespace: "0",
      prop: "extracts|info",
      exintro: "1",
      explaintext: "1",
      exlimit: "6",
      inprop: "url",
    }).toString();
    const res = await fetch(api, { headers: { "User-Agent": "ContinuED-demo/0.1 (education prototype)" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Source responded ${res.status}`);
    const data = await res.json();
    const pages = Object.values(data?.query?.pages ?? {}) as { pageid: number; title: string; extract?: string; fullurl: string; index?: number }[];
    const resources: CatalogItem[] = pages
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .filter((p) => p.extract && p.extract.length > 40)
      .map((p) => {
        const summary = p.extract!.slice(0, 1200);
        return {
          id: `web-${p.pageid}`,
          title: p.title,
          topic: topic || "Measurement and data",
          source: "Simple English Wikipedia",
          url: p.fullurl,
          estimatedMinutes: Math.max(5, Math.ceil(summary.split(/\s+/).length / 120) + 4),
          sizeMB: 0.1,
          summary,
          external: true,
        };
      });
    return NextResponse.json({ resources });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status: 502 });
  }
}
