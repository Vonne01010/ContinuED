import catalog from "../../data/catalog.json";
import competencies from "../../data/competencies.json";
import sampleSyllabus from "../../data/sampleSyllabus.json";
import quiz from "../../data/quiz.json";
import fallbackMatches from "../../data/fallbackMatches.json";
import type { QuizQuestion, CatalogItem, Competency, Match, Pkg, RawMatch, PackageItem } from "./types";

export const CATALOG = catalog as CatalogItem[];
export const COMPETENCIES = competencies as Competency[];
export const SAMPLE_SYLLABUS = sampleSyllabus as string[];
export const QUIZ = quiz as QuizQuestion[];
export const FALLBACK = fallbackMatches as RawMatch[];

export const catalogById = (id: string) => CATALOG.find((c) => c.id === id);
export const competencyByCode = (code: string) => COMPETENCIES.find((c) => c.code === code);

/** Seed state: 11 high-confidence matches approved, the 3 weaker ones awaiting review. */
export function seedMatches(): Match[] {
  return FALLBACK.map((m) => ({ ...m, status: m.confidence >= 0.8 ? "approved" : "pending" }));
}

export function buildItems(matches: Match[]): PackageItem[] {
  return matches
    .filter((m) => m.status === "approved")
    .flatMap((m) => {
      const r = catalogById(m.resourceId);
      return r ? [{ lesson: m.lesson, source: r.source, sizeMB: r.sizeMB, resourceId: r.id, title: r.title, url: r.url, minutes: r.estimatedMinutes, competencyCode: m.competencyCode }] : [];
    });
}

export function makePackage(items: PackageItem[], n: number): Pkg {
  const sizeMB = Math.round(items.reduce((s, i) => s + i.sizeMB, 0) * 10) / 10;
  return { id: `pkg-${n}`, version: `1.${n - 1}.0`, createdAt: new Date().toISOString(), sizeMB, items, synced: false };
}

export const SAMPLE_PACKAGE: Pkg = { ...makePackage(buildItems(seedMatches()), 1), synced: true, createdAt: "2026-10-12T08:00:00.000Z" };

/** Three earlier packages so a fresh demo already shows "Packages ready 3". */
export function seedPackages(): Pkg[] {
  const all = buildItems(seedMatches());
  const mk = (n: number, count: number, iso: string): Pkg => ({ ...makePackage(all.slice(0, count), n), createdAt: iso, synced: true });
  return [mk(1, 7, "2026-10-08T07:30:00.000Z"), mk(2, 9, "2026-10-10T07:45:00.000Z"), mk(3, 11, "2026-10-12T08:00:00.000Z")];
}
