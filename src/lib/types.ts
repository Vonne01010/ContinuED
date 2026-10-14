export type CatalogItem = { id: string; source: string; title: string; topic: string; url: string; estimatedMinutes: number; sizeMB: number };
export type Competency = { code: string; description: string; quarter: number };
export type RawMatch = { lesson: string; resourceId: string; competencyCode: string; confidence: number; reason: string };
export type Match = RawMatch & { status: "pending" | "approved" | "rejected" };
export type PackageItem = { lesson: string; source: string; resourceId: string; title: string; url: string; minutes: number; sizeMB: number; competencyCode: string };
export type Pkg = { id: string; version: string; createdAt: string; sizeMB: number; items: PackageItem[]; synced: boolean };
export type QuizQuestion = { id: string; question: string; options: string[]; correct: number; explanation: string };
export type StudentState = {
  xp: number;
  streak: number;
  lastDay: string; // local date of last activity
  progress: Record<string, number>; // lesson title -> 0..100
  minutesToday: number;
  minutesDay: string;
  badges: string[];
  quizBest: number;
};
export type PendingItem = { id: string; kind: "quiz"; label: string; xp: number; at: string; status: "pending" | "syncing" | "synced" };
