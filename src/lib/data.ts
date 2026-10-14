import catalog from "../../data/catalog.json";
import competencies from "../../data/competencies.json";
import sampleSyllabus from "../../data/sampleSyllabus.json";
import quizzes from "../../data/quizzes.json";
import notes from "../../data/lessonNotes.json";
import fallbackMatches from "../../data/fallbackMatches.json";
import type { CatalogItem, Competency, Match, PackageItem, Pkg, QuizQuestion, RawMatch, Section } from "./types";

export const CATALOG = catalog as CatalogItem[];
export const COMPETENCIES = competencies as Competency[];
export const SAMPLE_SYLLABUS = sampleSyllabus as string[];
export const QUIZZES = quizzes as unknown as Record<string, QuizQuestion[]>;
export const NOTES = notes as unknown as Record<string, Section[]>;
export const FALLBACK = fallbackMatches as RawMatch[];

export const competencyByCode = (code: string) => COMPETENCIES.find((c) => c.code === code);
export const catalogById = (id: string, list: CatalogItem[] = CATALOG) => list.find((c) => c.id === id);

/** Offline lesson content for a package item: built-in notes by topic plus any text pulled from the web. */
export function sectionsFor(item: { topic: string; title: string; source?: string }, summary?: string): Section[] {
  const out: Section[] = [];
  if (summary) out.push({ kind: "read", title: `About: ${item.title}`, body: summary });
  out.push(...(NOTES[item.topic] ?? []));
  if (!out.length) out.push({ kind: "read", title: item.title, body: "Open the resource when you are online to study this topic." });
  return out;
}

/** Seed state: confident matches approved, weaker ones awaiting review. */
export function seedMatches(): Match[] {
  return FALLBACK.map((m) => ({ ...m, status: m.confidence >= 0.8 ? "approved" : "pending" }));
}

export function buildItems(matches: Match[], list: CatalogItem[] = CATALOG): PackageItem[] {
  return matches
    .filter((m) => m.status === "approved")
    .flatMap((m) => {
      const r = catalogById(m.resourceId, list);
      return r
        ? [{ lesson: m.lesson, source: r.source, resourceId: r.id, title: r.title, topic: r.topic, summary: r.summary, url: r.url, minutes: r.estimatedMinutes, sizeMB: r.sizeMB, competencyCode: m.competencyCode }]
        : [];
    });
}

export function makePackage(items: PackageItem[], n: number): Pkg {
  const sizeMB = Math.round(items.reduce((s, i) => s + i.sizeMB, 0) * 10) / 10;
  return { id: `pkg-${Date.now()}`, version: `1.${n - 1}.0`, createdAt: new Date().toISOString(), sizeMB, items, synced: false };
}

export const SAMPLE_PACKAGE: Pkg = {
  ...makePackage(buildItems(seedMatches()), 1),
  id: "pkg-sample",
  synced: true,
  createdAt: "2026-10-12T08:00:00.000Z",
};

/** Earlier packages so a fresh demo already shows history. */
export function seedPackages(): Pkg[] {
  const all = buildItems(seedMatches());
  const mk = (n: number, count: number, iso: string): Pkg => ({ ...makePackage(all.slice(0, count), n), id: `pkg-seed-${n}`, createdAt: iso, synced: true });
  return [mk(1, 7, "2026-10-08T07:30:00.000Z"), mk(2, 9, "2026-10-10T07:45:00.000Z"), mk(3, 11, "2026-10-12T08:00:00.000Z")];
}
