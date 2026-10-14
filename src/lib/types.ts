export type CatalogItem = {
  id: string;
  source: string;
  title: string;
  topic: string;
  url: string;
  estimatedMinutes: number;
  sizeMB: number;
  summary?: string; // text pulled from an outside source; becomes offline reading in the package
  external?: boolean; // added by the teacher from outside the bundled catalog
};
export type Competency = { code: string; description: string; quarter: number };
export type RawMatch = { lesson: string; resourceId: string; competencyCode: string; confidence: number; reason: string };
export type Match = RawMatch & { status: "pending" | "approved" | "rejected" };
export type Section =
  | { kind: "read"; title: string; body: string }
  | { kind: "check"; question: string; options: string[]; correct: number; explanation: string };
export type PackageItem = {
  lesson: string;
  source: string;
  resourceId: string;
  title: string;
  topic: string;
  url: string;
  minutes: number;
  sizeMB: number;
  competencyCode: string;
  summary?: string; // text pulled from an outside source (used to build sections)
  sections?: Section[]; // offline lesson content, filled in when the package is built
};
export type Pkg = { id: string; version: string; createdAt: string; sizeMB: number; bytes?: number; items: PackageItem[]; synced: boolean };
export type QuizQuestion = { id: string; question: string; options: string[]; correct: number; explanation: string };
export type SubjectId = "math" | "science" | "english" | "filipino";
export type StudentState = {
  xp: number;
  streak: number;
  lastDay: string;
  progress: Record<string, number>; // lesson title -> 0..100
  minutesToday: number;
  minutesDay: string;
  badges: string[];
  quizBest: Record<string, number>; // subject -> best accuracy %
};
export type PendingItem = {
  id: string;
  kind: "quiz" | "lesson" | "game";
  subject?: string;
  label: string;
  xp: number;
  correct?: number;
  total?: number;
  at: string;
  status: "pending" | "syncing" | "synced";
  error?: string;
};
