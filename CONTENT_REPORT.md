# Content and source audit

Course: Psychology of Stress, Health and Well-Being, NOC26 HS169. Built from the 24 supplied PDFs in Week 1–12 folders. Source filenames, page counts, and SHA-256 hashes are recorded in `tools/authoring/sources.json`.

The bank contains **96 original assignment MCQs** (8 per week) and **504 authored notes MCQs**, 600 total. Notes questions cover definitions, distinctions, models, processes, study findings, examples, and applications. This is broad course coverage, not a guarantee of every conceivable MCQ or future exam question.

## Extraction and grounding

Weeks 1–11 assignment text was extracted with pdfplumber. The supplied bold option determines the key; extraction aborts if it finds zero or multiple matching keys. Original wording and option order are retained, with whitespace, line breaks, and extraction punctuation spacing normalized. Week 12’s image-only `Solution 12.pdf` was visually transcribed, including its selected radio-button keys. Its transcription is in `tools/extract_originals.py`.

All 96 assignment explanations link to a supporting notes page. All 504 generated questions have a notes filename, PDF page, and excerpt. Each authored question includes an exact source cue; rebuilding checks that this cue occurs on that page before emitting JSON. Questions were authored from the supplied notes, not by mechanically turning arbitrary sentences into questions. Explanations are paraphrases of course material.

Bibliography-only, title-only, and blank pages do not generate questions. External videos linked by the notes were not used to invent additional content. Pages containing both teaching content and references may still contribute questions from the teaching content.

## Coverage

| Week | Assignment | Notes | Notes PDF pages used | Pages excluded |
|---|---:|---:|---|---|
| 1 | 8 | 43 | 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 | 1 |
| 2 | 8 | 40 | 1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17 | 6, 11 |
| 3 | 8 | 46 | 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21 | 7, 8, 15, 22, 23 |
| 4 | 8 | 42 | 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | 6 |
| 5 | 8 | 41 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17 | 13, 18, 19 |
| 6 | 8 | 40 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | 12 |
| 7 | 8 | 40 | 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13 | 5, 9 |
| 8 | 8 | 38 | 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13 | 5, 10, 14 |
| 9 | 8 | 40 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | None |
| 10 | 8 | 58 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | None |
| 11 | 8 | 37 | 1, 2, 3, 4, 5, 6, 7, 8 | 9 |
| 12 | 8 | 39 | 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12 | 8, 13 |

Week 1 page 1 is a title page; Week 11 page 9 is blank. The other excluded pages are bibliographies or bibliography continuations.

## Source ambiguities preserved

- **Week 4, assignment Q6**: The supplied key marks D. Option B is also a partial description; D includes the fuller wording in the notes. The original options are preserved.
- **Week 4, assignment Q7**: The supplied key marks C. Option D is also consistent with the defense hierarchy taught in the notes. The original wording and key are preserved.
- **Week 7, assignment Q8**: This tests the historical positivity-ratio claim quoted by the course. Treat it as course recall, not a universal emotional target.
- **Week 8, assignment Q6**: This is a variance estimate reported in the course, not the proportion of an individual’s happiness controlled by circumstances.
- **Week 11, assignment Q4**: The term neurosis is preserved from the course’s Rogers discussion. This question tests that supplied terminology.
- **Week 12, assignment Q6**: The supplied solution selects A. The notes also describe experiencing beauty as a route to meaning, so D may appear plausible depending on the interpretation of “without any action”. The original key is preserved.

Generated questions on the historical positivity-ratio claim and happiness pie-chart estimates also display course caveats. Questions test the supplied notes rather than asserting that every historical course claim is a current universal scientific rule.

## Updating content

The reviewed seeds are in `tools/authoring/seeds-NN.txt`. Each line is `page|topic|question|correct option|distractor 1|distractor 2|distractor 3|explanation|exact source cue`. Append new questions rather than inserting before existing ones, so question IDs retain their meanings in saved progress. Use one unambiguous key and three distinct, plausible distractors. Check each explanation against the stated page.

`python tools/rebuild.py --source "Z:\NPTEL prep"` verifies source hashes, re-extracts assignments, rebuilds grounded excerpts, and writes `data/bank.json`. Install `tools/requirements.txt` first. Changed PDFs require a content review and updated manifest; the tool deliberately stops instead of silently reusing old keys. Notes question authoring is a reviewed step, not an automatic question generator for unseen courses.

For a major replacement course, change question IDs and the storage key in `core.js` to prevent unrelated old progress being reused. The JSON schema is shown by the existing bank and enforced by `validateBank`.
