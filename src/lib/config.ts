/** The product name lives here only. Rename the app by changing APP_NAME. */
export const APP_NAME = "ContinuED";
export const TAGLINE = "When school stops, learning continues.";
export const TEACHER = { name: "Ma'am Lou", short: "Lou", role: "Grade 3 Mathematics" };
export const STUDENT = { name: "Alex", grade: "Grade 3" };
export const DAILY_GOAL_MIN = 20;

export const SUBJECTS = [
  { id: "math", name: "Mathematics", icon: "➗", tint: "bg-blue/10" },
  { id: "science", name: "Science", icon: "🔬", tint: "bg-green/10" },
  { id: "english", name: "English", icon: "📖", tint: "bg-amber/15" },
  { id: "filipino", name: "Filipino", icon: "🌴", tint: "bg-danger/10" },
] as const;
