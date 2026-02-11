# Question Evidence Checker

Browser app to verify authored learning questions against open evidence.

## What It Does

- Imports your question set from pasted JSON or `.json` file.
- Supports common schemas:
  - `[{...}]`
  - `{"questions":[...]}`
  - `{"items":[...]}`
  - `{"data":[...]}`
- Understands fields like:
  - `id`
  - `stem` + `leadIn`
  - `options`
  - `correctIndex` (or inferred from `correctAnswer`/`correct`)
  - `explanation`
  - `references`
- Generates OpenEvidence prompts to check:
  - best answer correctness
  - explanation validity
  - claim-by-claim sentence checks
- Lets you track review state per question:
  - `Verified`
  - `Needs Revision`
  - `Unclear`
  - `Unreviewed`
- Stores review notes locally in browser `localStorage`.
- Exports evidence review reports as JSON or CSV.

## Run

Open:

`/Users/Alex/Documents/New project/question-evidence-checker/index.html`

If your browser blocks local file behavior, serve this folder locally:

```bash
cd /Users/Alex/Documents/New\ project/question-evidence-checker
python3 -m http.server 4174
```

Then open:

`http://localhost:4174`

## Suggested Workflow

1. Paste/import your question JSON.
2. Select one question.
3. Click `OpenEvidence` (and optionally `PubMed Search`).
4. Add citations and notes.
5. Mark status.
6. Export report when done.
