# ContinuED

*When school stops, learning continues.* An AI-assisted learning continuity app for Filipino K-12 students during class suspensions (typhoons, floods, earthquakes).

**Map → Match → Reach → Play**
1. **Map**: a teacher (Ma'am Lou, Grade 3 Math) loads her lesson plan.
2. **Match**: AI matches each lesson to a free resource (Khan Academy, Schoolhouse.world, CK-12, BBC Bitesize, Crash Course, or resources the teacher adds from outside) and a DepEd competency, with a confidence score and reason. The teacher approves or rejects.
3. **Reach**: she builds a versioned package that is uploaded to the school server. Student devices download it.
4. **Play**: a student (Alex, Grade 3) works through lessons, takes quizzes in four subjects, earns XP and streaks, all offline. Progress shows *Waiting to Sync* offline and syncs to the teacher when back online.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS. Static JSON in `/data`, `localStorage` in the browser, a tiny server-side store (see limitations). Hand-written service worker.

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

The name lives in one constant: `APP_NAME` in `src/lib/config.ts` (also `TAGLINE`, subjects, teacher and student names). The web manifest is generated from it (`src/app/manifest.ts`).

## Deploy (Vercel)

Push the repo, import it in Vercel (Next.js is auto-detected), optionally set `ANTHROPIC_API_KEY`, deploy. Service workers need HTTPS, which Vercel provides. Note the server-store limitation below.

## 2-minute demo script

1. Open `/teacher/lesson-plan`. The sample Grade 3 lessons are prefilled.
2. Click **Run AI matching**. Each lesson gets a resource, competency, confidence bar and reason.
3. In **Add resources from outside**, search e.g. "perimeter" (live Simple English Wikipedia lookup) and add a result, or import a JSON list by URL. Swap a lesson to the new resource with its dropdown.
4. Approve the weaker matches, then click **Build package**. The package is really uploaded to the school server (`/api/packages`) and verified.
5. Open `/student` (another browser or device on the same server works too). It downloads the new package automatically: "New lessons downloaded".
6. Tap **Continue Learning** to work through a lesson (reading steps and quick checks). Progress, XP and minutes save as you go.
6b. Try **Play** (Math Snake) and **Nearby** (share the package with a second device or tab).
7. Go offline (airplane mode or DevTools). Home, My Learning, lessons, Practice and Offline Library still load. Pick any subject in **Practice** and finish a quiz: it shows **Waiting to Sync**.
8. Reconnect. The queue syncs automatically (or tap **Sync now** in Offline Library). The teacher's Overview, Lesson plan stats and School server pages now show the student's real results.

Reset demo state: clear site data (localStorage) for the origin; delete `continued-store.json` in your OS temp folder to clear the server.

## Real vs. simulated

| Real | Simulated or limited |
|---|---|
| Claude matching via `/api/match` (with a key) and server-side ID validation | Matching without a key uses sample matches (labeled) |
| Outside resources: live search of Simple English Wikipedia and import from any public https JSON URL | Non-Khan catalog titles are illustrative; links go to section or home pages |
| **Build package**: uploads to `/api/packages`, adds offline lesson content, verifies, and student devices download it | The "school server" is this app's own server: memory plus a temp file, so it can reset on serverless hosting |
| **Sync**: queued quiz and lesson results are POSTed to `/api/sync`, retried on failure, auto-sent on reconnect; teacher pages read them back | One demo student; no accounts or auth |
| Lesson reader, per-lesson progress, XP, streak, badges, daily minutes (localStorage) | Offline lesson content is short built-in notes by topic (plus text from any web resource), not the full Khan or other resource |
| Practice quizzes for Math, Science, English and Filipino (offline, hardcoded questions) | Quiz questions are a small curated set (5 per subject) |
| Service worker caching, online/offline detection, storage estimate | Competency codes are MELC-style paraphrases to verify |

Imported web text (Simple English Wikipedia) is CC BY-SA; the source and link are shown with each resource.

## Peer-to-peer sharing and the game

- **Nearby** (`/student/nearby`) is real device-to-device transfer over a WebRTC data channel (`src/lib/p2p.ts`). There is no server in the path: the sender makes a connection code, the receiver pastes it and sends a reply code back, and the package travels directly between the two devices. Tabs of the same browser connect automatically. Both devices must be on the same Wi-Fi or phone hotspot. Some school or public networks block device-to-device traffic (client isolation), and there are no STUN/TURN servers, so it will not work across the internet.
- **Math Snake** (`/student/play`) is a small gamified lesson: steer the snake to the correct answer to grow it. It works offline, awards XP, can earn the Snake Charmer badge, and queues its score for sync like quizzes.

## Hardcoded demo content

Profiles, the My Learning units for Science/English/Filipino, badges and the activity feed are hardcoded in `src/lib/profiles.ts` (not real personal data). Quizzes are in `data/quizzes.json`, lesson notes in `data/lessonNotes.json`.

## Known limitations

- Resource import fetches server-side and blocks obvious private addresses, but it is a demo-grade guard (no DNS-rebinding protection).
- Without a real database, package and sync data live on one server instance. For production, replace `src/lib/serverStore.ts` with a database and add authentication.
- Resource links go to each source's section or home page because deep links were not verified.

## Layout

- `src/lib/config.ts` product constants · `src/components/ui.tsx` design system
- `src/app/teacher/*` dashboard (`lesson-plan` is the main screen) · `src/app/student/*` PWA (`lesson`, `quiz`, `offline`)
- `src/app/api/{match,packages,sync,resources}` server routes · `src/lib/serverStore.ts` server-side store
- `public/sw.js` service worker: precaches student routes and their JS/CSS, stale-while-revalidate otherwise, never touches teacher pages or `/api`
- `data/*.json` catalog, competencies, sample lessons, fallback matches, quizzes, lesson notes
