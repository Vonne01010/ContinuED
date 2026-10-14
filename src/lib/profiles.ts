/** Hardcoded demo profile and learning content. Nothing here is real personal data. */

export const STUDENT_PROFILE = {
  fullName: "Alex Miguel Santos",
  nickname: "Alex",
  avatar: "🦊",
  grade: "Grade 3",
  section: "Sampaguita",
  school: "Rizal Elementary School (demo)",
  adviser: "Ma'am Lou Reyes",
  studentNo: "DEMO-2026-0314",
  age: 8,
  joined: "August 2026",
  favoriteSubject: "Mathematics",
  dream: "I want to become a marine biologist.",
  languages: ["Filipino", "English"],
  goals: ["Study 20 minutes every day", "Finish all Math lessons this quarter", "Learn the 6 to 9 times tables"],
  interests: ["Drawing", "Basketball", "Animals"],
};

export const TEACHER_PROFILE = {
  fullName: "Louisa Marie Reyes",
  display: "Ma'am Lou",
  avatar: "👩‍🏫",
  role: "Grade 3 Mathematics Teacher",
  school: "Rizal Elementary School (demo)",
  division: "Schools Division Office (demo)",
  advisory: "Grade 3 - Sampaguita",
  students: 32,
  yearsTeaching: 9,
  email: "lou.reyes@demo-school.example",
  phone: "0917 000 0000 (demo)",
  bio: "I believe every child can love math when it starts with a story. During typhoon season I prepare offline lessons so learning never stops.",
  subjects: ["Mathematics 3", "Mathematics 3 (remedial)"],
  strengths: ["Offline lesson planning", "Peer tutoring", "Parent communication"],
  schedule: [
    ["Mon - Fri", "7:30 AM", "Homeroom and Mathematics 3 - Sampaguita"],
    ["Mon, Wed", "1:00 PM", "Remedial Mathematics"],
    ["Fri", "3:00 PM", "Lesson plan review"],
  ],
};

export type Badge = { id: string; name: string; icon: string; how: string; tint: string };
export const BADGES: Badge[] = [
  { id: "First Steps", name: "First Steps", icon: "👣", how: "Open ContinuED for the first time.", tint: "bg-blue/10" },
  { id: "Lesson Learner", name: "Lesson Learner", icon: "📘", how: "Finish a lesson.", tint: "bg-green/10" },
  { id: "Sharp Mind", name: "Sharp Mind", icon: "🧠", how: "Get 4 or more correct in any quiz.", tint: "bg-amber/15" },
  { id: "Offline Learner", name: "Offline Learner", icon: "📡", how: "Finish a quiz with no internet.", tint: "bg-navy/10" },
  { id: "Streak Starter", name: "Streak Starter", icon: "🔥", how: "Keep a 3-day streak.", tint: "bg-orange-100" },
  { id: "Snake Charmer", name: "Snake Charmer", icon: "🐍", how: "Get 6 or more correct in Math Snake.", tint: "bg-green/10" },
  { id: "Good Neighbor", name: "Good Neighbor", icon: "🤝", how: "Share or receive lessons with a nearby device.", tint: "bg-blue/10" },
  { id: "Explorer", name: "Explorer", icon: "🧭", how: "Try a quiz in 3 different subjects.", tint: "bg-danger/10" },
];

export type LearningUnit = { title: string; lessons: string[] };
export type LearningSubject = { id: string; name: string; icon: string; tint: string; blurb: string; units: LearningUnit[] };

/** Hardcoded "My Learning" map. Mathematics is replaced by the live package lessons on the page. */
export const LEARNING: LearningSubject[] = [
  {
    id: "science",
    name: "Science",
    icon: "🔬",
    tint: "bg-green/10",
    blurb: "Living things, matter and staying safe in storms and earthquakes.",
    units: [
      { title: "Living things and their needs", lessons: ["Plants, animals and people", "What plants need to grow", "Habitats around us"] },
      { title: "Matter", lessons: ["Solids, liquids and gases", "Melting and freezing", "Magnets and what they attract"] },
      { title: "Disaster safety", lessons: ["Typhoon preparedness", "Duck, Cover and Hold", "Making a go-bag"] },
    ],
  },
  {
    id: "english",
    name: "English",
    icon: "📖",
    tint: "bg-amber/15",
    blurb: "Words, sentences and short stories.",
    units: [
      { title: "Grammar basics", lessons: ["Nouns", "Verbs", "Singular and plural"] },
      { title: "Vocabulary", lessons: ["Opposites", "Words that sound alike", "Describing words"] },
      { title: "Writing", lessons: ["Capital letters and periods", "Writing a sentence", "A short paragraph"] },
    ],
  },
  {
    id: "filipino",
    name: "Filipino",
    icon: "🌴",
    tint: "bg-danger/10",
    blurb: "Mga salita, pangungusap at maikling kuwento.",
    units: [
      { title: "Mga bahagi ng pananalita", lessons: ["Pangngalan", "Pandiwa", "Pang-uri"] },
      { title: "Bokabularyo", lessons: ["Magkasalungat na salita", "Pantig at ponema", "Salitang magkatugma"] },
      { title: "Pagbasa", lessons: ["Maikling kuwento", "Pag-unawa sa binasa", "Pagsagot ng tanong"] },
    ],
  },
];

export const ACTIVITY = [
  { icon: "✅", text: "Finished: Adding 3-digit numbers without regrouping", when: "Yesterday" },
  { icon: "🏅", text: "Earned the First Steps badge", when: "2 days ago" },
  { icon: "✏️", text: "Math quiz: 4 of 5 correct", when: "2 days ago" },
  { icon: "📥", text: "Downloaded package v1.2.0 from the school server", when: "3 days ago" },
];
