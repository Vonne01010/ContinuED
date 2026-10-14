import { NextResponse } from "next/server";
import { CATALOG, COMPETENCIES, FALLBACK } from "@/lib/data";
import type { CatalogItem, RawMatch } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You match Grade 3 Math syllabus lessons (Philippines) to free learning resources from several sources (Khan Academy, Schoolhouse.world, CK-12, BBC Bitesize, Crash Course, ...) and DepEd competencies. Choose the single best-fitting resource regardless of source; do not favor one source.
Respond with ONLY valid JSON, no prose, no code fences: an array with one object per lesson, in the same order:
[{"lesson": string (copied exactly), "resourceId": string (must be an id from the catalog), "competencyCode": string (must be a code from the competencies list), "confidence": number between 0 and 1, "reason": string (one sentence)}]
Be honest: use low confidence when the resource only partly covers the lesson.`;

function parseJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
}

function fallbackFor(lessons: string[], catalog: CatalogItem[]): RawMatch[] {
  return lessons.map((lesson, i) => {
    const exact = FALLBACK.find((f) => f.lesson.toLowerCase() === lesson.toLowerCase());
    if (exact) return exact;
    // Unknown lesson: crude keyword overlap against catalog titles.
    const words = lesson.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    let best = catalog[0];
    let bestScore = -1;
    for (const c of catalog) {
      const hay = `${c.title} ${c.topic}`.toLowerCase();
      const score = words.filter((w) => hay.includes(w)).length;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    const base = FALLBACK.find((f) => f.resourceId === best.id) ?? FALLBACK[i % FALLBACK.length];
    return {
      lesson,
      resourceId: best.id,
      competencyCode: base.competencyCode,
      confidence: bestScore > 0 ? 0.55 : 0.3,
      reason: "Offline keyword match (AI unavailable); please review.",
    };
  });
}

export async function POST(req: Request) {
  let lessons: string[] = [];
  let catalog: CatalogItem[] = CATALOG;
  try {
    const body = await req.json();
    // Resources the teacher added from outside the bundled catalog (validated, capped).
    const extra = (Array.isArray(body.resources) ? body.resources : []).slice(0, 60).filter((r: CatalogItem) => r && typeof r.id === "string" && typeof r.title === "string" && !CATALOG.some((c) => c.id === r.id)).map((r: CatalogItem) => ({ id: String(r.id).slice(0, 80), title: String(r.title).slice(0, 160), topic: String(r.topic ?? "").slice(0, 60), source: String(r.source ?? "").slice(0, 60), url: String(r.url ?? ""), estimatedMinutes: Number(r.estimatedMinutes) || 10, sizeMB: Number(r.sizeMB) || 0.5 }));
    catalog = [...CATALOG, ...extra];
    lessons = (Array.isArray(body.lessons) ? body.lessons : [])
      .map(String)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 40);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!lessons.length) return NextResponse.json({ error: "No lessons" }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ matches: fallbackFor(lessons, catalog), source: "fallback", note: "No ANTHROPIC_API_KEY set" });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              lessons,
              catalog: catalog.map(({ id, title, topic, source }) => ({ id, title, topic, source })),
              competencies: COMPETENCIES.map(({ code, description }) => ({ code, description })),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = await res.json();
    const text: string = (data.content ?? []).map((b: { text?: string }) => b.text ?? "").join("");
    const parsed = parseJson(text);
    if (!Array.isArray(parsed)) throw new Error("Not an array");

    const ids = new Set(catalog.map((c) => c.id));
    const codes = new Set(COMPETENCIES.map((c) => c.code));
    const valid: RawMatch[] = (parsed as RawMatch[])
      .filter((m) => m && typeof m.lesson === "string" && lessons.includes(m.lesson) && ids.has(m.resourceId) && codes.has(m.competencyCode))
      .map((m) => ({
        lesson: m.lesson,
        resourceId: m.resourceId,
        competencyCode: m.competencyCode,
        confidence: Math.min(1, Math.max(0, Number(m.confidence) || 0)),
        reason: String(m.reason ?? ""),
      }));
    // Fill any lessons the model dropped or matched invalidly with fallback entries.
    const have = new Set(valid.map((m) => m.lesson));
    const missing = lessons.filter((l) => !have.has(l));
    const matches = [...valid, ...fallbackFor(missing, catalog)].sort((a, b) => lessons.indexOf(a.lesson) - lessons.indexOf(b.lesson));
    if (!valid.length) throw new Error("No valid matches");
    return NextResponse.json({ matches, source: missing.length ? "ai+fallback" : "ai" });
  } catch (e) {
    return NextResponse.json({ matches: fallbackFor(lessons, catalog), source: "fallback", note: e instanceof Error ? e.message : "error" });
  }
}
