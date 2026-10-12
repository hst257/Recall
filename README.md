# Recall — your NPTEL study space

A static study app for **Psychology of Stress, Health and Well-Being (NOC26 HS169)**. It includes **600 MCQs across 12 weeks: 96 original assignments and 504 questions authored from your notes**. No account, backend, API key, package installation, or build is needed to use the website.

## Open it locally

Extract the ZIP, open a terminal in the `recall-study` folder, and run:

```sh
python -m http.server 8000
```

Open **http://localhost:8000** in your browser. Keep the terminal running while studying. Stop it with Ctrl+C when finished. If your Windows Python command is `py`, use `py -m http.server 8000`.

Opening `index.html` by double-clicking cannot load the question JSON reliably. Use the local server or GitHub Pages. The initial website load requires access to its files; this version does not install an offline service worker.

## Publish with GitHub Pages

1. Create a GitHub repository. A public repository works with GitHub Free.
2. Upload **the contents of `recall-study`** into the repository root. `index.html`, `app.js`, `core.js`, `styles.css`, `favicon.svg`, `.nojekyll`, and the `data` folder must be together at that root. `data/bank.json` must be included. The documentation, tests, and tools can also be uploaded.
3. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your branch (usually `main`) and **/(root)**, then save.
5. When deployment finishes, open the address shown by GitHub, normally `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

For an existing repository, you may instead put the app contents inside `/docs` and choose **/docs** as the publishing folder. Relative asset and data URLs support both GitHub project sites and custom domains. `.nojekyll` lets GitHub serve the static files directly. Follow GitHub’s [publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [site-creation guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) if the settings differ.

The original PDFs are not included in this package. They remain in your existing week folders; source citations identify their filenames and PDF page numbers.

## Study with it

- Select one week, several weeks, or all 12. Choose original assignments, notes questions, or both.
- **Practice:** select an answer and check it to see the correct answer, explanation, and source evidence. Checked answers lock and count once. You can save and resume an unfinished session after refreshing or closing the page.
- **Timed exam:** set a question count and 1–240 minutes. Answers remain hidden until submission. Navigate freely, change answers, and flag questions before submitting. The deadline keeps running when you leave or refresh; an expired exam is submitted when the page is running or next opened. Correct answers earn one point; there is no negative marking.
- **Weak review:** wrong and skipped questions join the queue. Two consecutive correct answers remove a question. Review focus also supports unseen and saved questions.
- **Question bank:** search topics, wording, and options; filter by week, source, or review status. Open a question to read its answer and explanation.
- **Progress:** see coverage, accuracy across all attempts, weak questions, bookmarks, and the latest sessions. Export a JSON backup before moving devices or clearing browser data. Import validates a backup before replacing current progress.
- Keyboard: **1–4** selects the displayed option. **Enter** checks or advances when focus is outside a button. Normal Tab/Enter button navigation also works.

Flags belong to the current session. Saved questions persist across sessions. Finishing practice grades selected but unchecked answers and treats unanswered questions as skipped, so they join weak review. Replacing an unfinished session preserves already checked attempts; unchecked answers in the replaced session do not count.

Progress uses localStorage in the current browser and site origin. Local preview and GitHub Pages have separate progress; use export/import to transfer it. Clearing site data removes local progress. Saving failures are shown, damaged stored data is protected until you import or reset, and a tab pauses saving if another tab changes progress. Reload that tab before continuing. The bank and answer keys are public static files; exam mode is intended for self-practice.

Page links preserve the practice, question-bank, progress, and active-quiz views on refresh and support browser Back/Forward. A completed exam's duration stops at its original deadline even if you reopen the page later. Backup filenames use your browser's local calendar date. About this question bank is available in the header on both desktop and mobile.

## Content and maintenance

See [CONTENT_REPORT.md](CONTENT_REPORT.md) for page coverage, extraction methods, source ambiguities, and how to author more questions. Assignment wording, original option order, and supplied keys are preserved with extraction whitespace normalized. Week 12 was visually transcribed from the image-only solution. Some original options overlap; source caveats explain these without changing the official key.

The 504 notes questions cover the substantive teaching pages, with grounded explanations and exact page evidence. They are generated study questions, not official exam predictions. Historical claims in the notes are identified where relevant.

Optional maintenance commands, run inside this folder:

```sh
node --test tests/core.test.mjs
python -m pip install -r tools/requirements.txt
python tools/rebuild.py --source "Z:\NPTEL prep"
```

The app needs none of these developer dependencies at runtime. Rebuilding checks all source PDF hashes, extracts the original keyed assignments, validates the authored source cues, and emits `data/bank.json`. It stops on changed PDFs so old keys cannot silently be applied to new material. The reviewed question seeds are included under `tools/authoring`.

## Package map

| File/folder | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js`, `core.js` | Website and study logic |
| `data/bank.json` | All 600 questions, keys, explanations, and citations |
| `CONTENT_REPORT.md` | Coverage and source-quality audit |
| `tools/` | Rebuild script, extraction script, reviewed seeds, source hashes |
| `tests/core.test.mjs` | Data, grading, weak-review, shuffle, recovery, and import checks |

No analytics, third-party fonts, or external runtime services are used. Serve the folder unchanged; no build step is needed.
