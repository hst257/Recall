# Verification

Verified on 12 October 2026.

## Content

- 24 source PDFs inventoried and hashed; originals unchanged.
- 96 assignment questions extracted/transcribed, 8 per week, with their supplied keys and original option order.
- 504 notes questions built from reviewed authoring seeds. Every seed's exact cue was found on its cited notes page; all 96 assignment explanations also passed their notes-cue checks.
- The portable rebuild tool successfully regenerated the 600-question bank directly from `Z:\NPTEL prep`.
- Data checks verify unique IDs, four distinct options, valid answer indices, explanations, per-week content, citations, and all 12 original answer-key sequences.

## Automated study-logic checks

`node --test tests/core.test.mjs`: **16 passed, 0 failed**. These cover data integrity; grading; weak-question recovery and relapse; combined filters; answer identity under shuffling; one-time attempt recording and idempotent completion; exam recovery with a fixed deadline; malformed backups; rejection of fake checked exam answers; checked-practice backup recovery; practice with an invalid hidden exam duration; route recovery; delayed and early exam submission timestamps; impossible imported deadlines and scores; and local calendar dates in backup filenames.

`node --check app.js` and `node --check core.js` also pass.

## Browser checks

- Original assignment-only practice in supplied order.
- Wrong-answer feedback, correct-answer highlighting, authored explanations, and source details. Keyboard 1–4 selection and Enter checking were also exercised.
- Bookmark persistence and locked checked answers after page refresh and resume.
- Finish confirmation, skipped-question scoring, and weak-review totals.
- Exam answers remain hidden, selected answers persist through refresh, and flags/navigation survive saving.
- A one-minute exam automatically completed after its fixed deadline and appeared in history with the expected score.
- Progress export and re-import of 8 question records and 3 completed sessions.
- Question-bank search and expandable explanations, without misleading attempt labels on unattempted questions.
- All-week selection gives 600 questions; an empty week selection disables starting.
- Laptop and phone breakpoints checked with no page-level horizontal overflow; touch-friendly options and stacked quiz navigation on narrow screens.
- Temporary preview progress was reset after testing.

The package uses relative assets and JSON URLs, has `.nojekyll`, and requires no application build. GitHub Pages deployment steps are in `README.md`.

## Bug-fix verification on 12 October 2026

- Reproduced the invalid-duration bug and verified that both practice and missed-question retry start even when a previous exam duration is invalid. Timed exams still reject invalid durations before replacing an active session.
- Opened the question bank directly at `#bank`, refreshed it, navigated to progress, and exercised browser Back and Forward. The URL, selected navigation item, and displayed view remain consistent. An active quiz restores directly after refresh.
- Kept the Skip to study content link from creating an unrelated history entry. Completed sessions replace the quiz history entry.
- Moved About this question bank into the always-visible header. It opens on narrow screens, and the dialog initially focuses its title rather than scrolling to its Close button.
- Removed a bookmark while using the Saved questions filter. The question disappears immediately and the matching-question count updates.
- Imported a one-minute exam whose deadline was an hour in the past. It automatically submitted with 1 correct and 7 skipped answers, and history recorded a duration of exactly 1 minute. Input handlers also check the deadline before accepting an answer.
- Rejected an imported deadline at or before the exam's start time. Unit tests also reject fractional timestamps, overlong deadlines, fractional history counts, and inconsistent history percentages.
- Exported and re-imported the completed exam successfully. The final exported filename used the browser's local date, 12 October, rather than the previous UTC day.
- Changed progress in a second tab, observed the saving-paused warning, and confirmed that reloading recovers the updated progress. Clearing storage in another tab is also handled by the storage-event listener.
- Checked 390px and 320px phone viewports without page-level horizontal overflow. Browser verification reported no console warnings or errors.
- Rechecked all 24 source PDF hashes against the manifest; all match. The 600-question bank is unchanged.
- Added `.gitignore` for dependency caches, local settings, personal progress exports, generated screenshots, logs, and OS metadata. Runtime assets, question data, tests, and authoring sources remain included.

Browser screenshots are available locally in `artifacts/mobile-help.jpg` and `artifacts/mobile-navigation.jpg`; generated screenshots are excluded from Git.

## Hosting diagnosis on 13 October 2026

- Local `main` and remote `main` matched at `039b3f6`; the working tree was clean. All runtime files and the 600-question bank were tracked in the repository root.
- GitHub Pages was enabled for `hst257/Recall`, with `main` and `/ (root)` selected and no custom domain. The public project-site URL returned HTTP 404.
- GitHub reported zero workflow runs, zero deployments, and zero checks for the initial commit. The browser showed the Actions onboarding page, confirming that no Pages deployment had run.
- Added `.github/workflows/pages.yml` to validate JavaScript and study logic, package only runtime files, and deploy the artifact on every push to `main` or a manual workflow run. Pages must use the GitHub Actions source described in `README.md`.
- Added `_site` to `.gitignore` so local deployment artifacts are not committed.

