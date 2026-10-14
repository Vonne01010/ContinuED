# ContinuED: Live Demo Script (about 4 minutes)

Pitch recap this follows: **Map, Match, Reach, Play.** Two roles: **Ma'am Lou** (teacher, laptop) and **Alex** (student, phone). Use two screens if you can: laptop on `/teacher/lesson-plan`, phone on `/student`.

## Before you go on stage (5 minutes)

1. Deploy or run a production build (`npm run build && npm start`). The offline features need a production build over HTTPS (Vercel) or localhost.
2. **Phone, online:** open `/student` once and wait for **"Online · Offline ready"**. Add to home screen if you want the app look.
3. **Laptop:** open `/teacher/lesson-plan`. Clear site data first so the numbers start fresh (Lessons matched 12/14, Packages ready 3).
4. For the sharing beat, have a second device ready (a second phone, or a second laptop tab). Put both on the same Wi-Fi or hotspot. Open `/student/nearby` on both.
5. Have your `ANTHROPIC_API_KEY` set if you want live AI matching. Without it the screen says "Showing sample matches", which is fine and honest. Say so if asked.
6. Backup: record a 60-second screen capture of the whole flow, in case Wi-Fi fails.

> **Name note:** your pitch deck says "Kid, Grade 2". The app profile is **Alex, Grade 3**, with Grade 3 Math lessons. Either say "Kid, whom we call Alex in the app", or change the profile name in `src/lib/profiles.ts` and `src/lib/config.ts` before presenting.

---

## Scene 1: MAP (Ma'am Lou, laptop), 0:00 to 0:40

**Screen:** `/teacher/lesson-plan`

**Say:**
"It's 5 a.m. Classes are suspended. Ma'am Lou is worried about her own family, not about preparing worksheets. So before this day, she already did one thing: she pasted her Grade 3 Math lesson plan into ContinuED."

**Do:** Point at the 14 lessons in the box. Point at the three-step tracker at the top: Add your lessons, Review matches, Build and send.

**Say:**
"That's the **Map** step. One lesson per line. She can also upload a text or JSON file."

---

## Scene 2: MATCH, 0:40 to 1:50

**Do:** Click **Run AI matching**.

**Say:**
"Now **Match**. The AI looks at each lesson and picks a free resource from Khan Academy, Schoolhouse.world, CK-12 or BBC Bitesize, and the matching DepEd competency. You see a confidence bar and a one-sentence reason for each."

**Do:** Scroll the table. Point at a green row, then an amber row (for example "Comparing fractions", about 58 percent).

**Say:**
"Green means the AI is confident. Amber means check it yourself. The teacher stays in control: she can change the resource from the dropdown, approve, or reject. I can also approve everything the AI is sure about with one button."

**Do:** Click **Approve all high-confidence**. Then approve one amber row. Show **Lessons matched** going up.

**Do (optional, 20 seconds):** In **Add resources from outside**, type `perimeter`, click Search, click **+ Add** on a result, and choose it in a row's dropdown.

**Say:**
"She is not locked to our list. She can search an open source online, or import a list from any link, and it goes into the offline lesson."

---

## Scene 3: REACH, 1:50 to 2:25

**Do:** Scroll to step 3 and click **Build package**.

**Say:**
"Now **Reach**. One click builds a package: the lessons, short notes and checks, and a version number. It uploads to the school server and the server confirms it. That is the last thing Ma'am Lou has to do."

**Do:** Show the progress bar finishing on "Synced to the school server", then open the manifest.

**Say:**
"From here, no teacher work. The package waits for students."

---

## Scene 4: PLAY (Alex, phone), 2:25 to 3:30

**Do:** Switch to the phone, open `/student`.

**Say:**
"This is Alex. The phone picked up the new package by itself: 'New lessons downloaded'. Alex sees a learning path, a streak, XP and a daily goal."

**Do:** Tap **Continue Learning**. Read one step, answer the quick check, tap through the lesson.

**Say:**
"Short reading steps and a check at the end. Finishing gives XP and a badge."

**Do:** Open the **Play** tab, start **Math Snake**, steer to one correct answer.

**Say:**
"Learning should feel like play. In Math Snake, you eat the correct answer to grow. Same math, more fun."

---

## Scene 5: NO INTERNET, 3:30 to 4:10

**Do:** Turn on **airplane mode** (or toggle offline in the browser). The banner turns amber: "You are offline."

**Say:**
"Now the storm hits and the internet drops. Nothing breaks."

**Do:** Open **My Learning**, open a lesson, then **Practice**, pick **Science**, answer a couple of questions.

**Say:**
"Lessons, quizzes and games all work offline. The result shows **Waiting to Sync**."

**Do:** Open **Offline Library** to show the waiting item. Turn airplane mode off.

**Say:**
"The moment the phone is back online, it sends progress to the teacher automatically."

**Do:** Cut to the laptop: **School server** or **Overview** shows Alex's results and progress.

---

## Scene 6: SHARE WITHOUT INTERNET, 4:10 to 4:50

**Do:** On two devices, open **Nearby**. Device 1: **Start sharing**. Device 2: **Get lessons** then **Look for a nearby sender** (same browser), or paste the codes between two phones.

**Say:**
"One more thing. Not every student has a phone with a package. So a classmate can pass the lessons straight to theirs: phone to phone, over the same Wi-Fi or hotspot, with no internet."

**Do:** Show the progress finishing and "Received package", then open My Learning on the second device.

---

## Closing line (10 seconds)

"Map. Match. Reach. Play. Ma'am Lou prepared once, before the storm. Alex kept learning during it. That is ContinuED: when school stops, learning continues."

---

## Likely questions, with honest answers

- **Is the AI real?** Yes when a key is set: Claude matches lessons and the server checks every resource ID. Without a key it shows labeled sample matches.
- **Where do the lessons come from?** Free sources such as Khan Academy, CK-12, BBC Bitesize and Schoolhouse.world, plus anything the teacher adds. The offline lessons are short built-in notes and checks by topic. The full resource opens in the source's site when online.
- **Is the school server real?** In the demo it is this app's own server (memory plus a temp file). Production would use a real database and a school-hosted box.
- **Does peer-to-peer need internet?** No, but both devices must be on the same Wi-Fi or hotspot. Some school networks block device-to-device traffic.
- **What about accounts and data privacy?** Not built yet. It is the first item on the roadmap before the pilot.

## If something goes wrong

| Problem | Do this |
|---|---|
| No Wi-Fi at the venue | Run on localhost on the laptop and use a phone hotspot, or play the backup recording. |
| AI call is slow | Say "it falls back to sample matches so the demo never stops", and continue. |
| Sharing does not connect | Switch to two tabs of one browser (they auto-connect), or skip to the closing line. |
| Phone does not show "Offline ready" | Reload `/student` once while online and wait about 10 seconds. |
