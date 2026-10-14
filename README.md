# ContinuED

*When school stops, learning continues.* An AI-assisted learning continuity app for Filipino K-12 students during class suspensions (typhoons, floods, earthquakes).

**Map → Match → Reach → Play**
1. **Map**: a teacher (Ma'am Lou, Grade 3 Math) loads her syllabus lessons.
2. **Match**: AI matches each lesson to a free resource (Khan Academy, Schoolhouse.world, CK-12, BBC Bitesize, Crash Course) and a DepEd competency, with a confidence score and reason. The teacher approves or rejects.
3. **Reach**: she builds a versioned package that "syncs to the school server" (simulated). The student app reads it for offline use.
4. **Play**: a student (Alex, Grade 3) continues a lesson, takes a quiz, earns XP and streaks, all offline. Progress shows *Waiting to Sync* offline and *Synced* after reconnecting.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS. No database: static JSON in `/data` plus `localStorage`. Hand-written service worker.

## Setup

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Test offline behavior against a production build (`npm run build && npm start`); the service worker is not meaningful in dev.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Real matching via `claude-sonnet-4-6`. Without it (or on any API error) `/api/match` uses `data/fallbackMatches.json` and the UI says "Showing sample matches". |

## Renaming the product

The name lives in one constant: `APP_NAME` in `src/lib/config.ts` (also `TAGLINE`, teacher and student names). The web manifest is generated from it (`src/app/manifest.ts`).

## Deploy (Vercel)

Push the repo, import it in Vercel (Next.js is auto-detected), optionally set `ANTHROPIC_API_KEY`, deploy. Service workers need HTTPS, which Vercel provides.

## 2-minute demo script

1. Open `/teacher/curriculum`. The sample Grade 3 syllabus is prefilled (stats: Lessons matched 12/14).
2. Click **Run AI matching**. Each lesson gets a resource, competency, confidence bar and reason.
3. Approve the weaker matches (amber bars, e.g. "Comparing fractions", "Measuring length"). Watch **Lessons matched** climb.
4. Click **Build package**. Watch the simulated sync to the school server (tagged *Demo*), then the manifest appears.
5. Open `/student` (phone-width or a real phone). Note **Offline-ready · N lessons downloaded** (N is the real package size) and the "Online · Offline ready" indicator.
6. Turn on airplane mode (or DevTools → Network → Offline). The badge flips to **Offline**; Home, Practice and Offline Library still load.
7. Tap **Continue Learning**, then take the **Practice quiz**. Answers are only revealed after *Check Answer*. Finish for XP, a badge and the results screen: "Waiting to Sync".
8. Reconnect, open **Offline Library**, tap **Sync now**. The queue flips to **Synced**.

Reset demo state: clear site data (localStorage) for the origin.

## Real vs. simulated

| Real | Simulated (labeled "Demo" or noted in UI) |
|---|---|
| Claude matching via `/api/match` (with a key) and server-side ID validation | Matching results without a key (sample matches) |
| Package manifest saved in localStorage and read by `/student` | Sync to the "school server", server status page, activity feed, "82%" class progress |
| Service worker, offline caching, installable manifest | **Sync now**: marks the local queue Synced; nothing is sent anywhere |
| Online/offline detection (`navigator.onLine` and events) | Science, English, Filipino subject cards (static placeholders) |
| XP, streak, level, badges, daily minutes, pending-sync queue (localStorage) | Package sizes (estimated per resource) |
| Quiz scoring and storage estimate (`navigator.storage.estimate`, where supported) | |

## Known limitations

- There is no lesson reader. **Continue Learning** advances progress locally; the source resource (Khan Academy etc.) opens in a new tab and needs internet. Offline you get the lesson list, progress and quiz.
- Resource links go to each source's Grade 3 section or homepage because deep links weren't verified; non-Khan resource titles are illustrative. DepEd competency codes/descriptions are MELC-style paraphrases to check against the official MELC.
- Daily minutes and streak are tracked per device.

## Layout

- `src/lib/config.ts` product constants · `src/components/ui.tsx` design system (Button, Card, ProgressBar, CircularProgress, StatusChip, XPBadge, StreakBadge, SubjectCard, LessonCard, AnswerCard, Empty/Loading/ErrorState)
- `src/app/teacher/*` dashboard (`curriculum` is the main screen) · `src/app/student/*` PWA (`quiz`, `offline`) · `src/app/api/match` matching route
- `public/sw.js` service worker: precaches student routes and their JS/CSS, stale-while-revalidate otherwise, never touches teacher pages
- `data/*.json` catalog, competencies, sample syllabus, fallback matches, quiz
