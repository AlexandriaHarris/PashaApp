# Pasha Inservice Arena

Browser-based study game for ENT inservice review, generated from your local Pasha text extracts.

## What It Does

- Builds a large fact bank from `Pasha*.txt` files using:
  - keyed facts (`term: definition`)
  - prose statement mining (from non-colon narrative lines)
- Runs a multiple-choice quiz game with:
  - faceted filtering before each round:
    - topic
    - chapter
    - section (subchapter headings)
    - organ system
    - disease domain
    - focus area (eg, thyroid)
    - keyword search
  - mixed or single-direction question mode
  - cloze mode with typed distractors (eg, percentages, genes/markers, CNs, stages, measurements)
  - timed mode (optional)
  - prose fact toggle (off by default to reduce noisy questions)
  - score, streak, and missed-fact review
  - download of missed facts for focused review
  - one-click `Open In OpenEvidence` link on each question (with query text copied to clipboard)

## Source Files

Default source directory:

`/Users/Alex/Desktop/ENT practice tests/ENT Resources/Pasha_Text_Extracts`

## Build the Question Bank

From this folder:

```bash
node scripts/buildQuestionBank.js
```

This writes:

- `data/pasha-question-bank.json`
- `data/pasha-question-bank.js`

## Launch the Game

Open `index.html` in your browser.

If your browser blocks local script loading from `file://`, run a local server:

```bash
python3 -m http.server 4173
```

Then open:

`http://localhost:4173`

## Deploy to GitHub Pages

This repository includes a workflow at:

`/Users/Alex/Documents/New project/.github/workflows/deploy-pasha-inservice-pages.yml`

It deploys the folder:

`/Users/Alex/Documents/New project/pasha-inservice-game`

### One-time GitHub setup

1. Push this repo to GitHub.
2. In GitHub, open **Settings -> Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` or `master` (or run the workflow manually from **Actions**).

### Site URL

After deploy, GitHub Pages will publish at:

`https://<your-github-username>.github.io/<repo-name>/`

If you publish textbook-derived content, keep access limited to comply with licensing/copyright expectations.

## Optional: Different Source Directory

```bash
PASHA_SOURCE_DIR="/path/to/your/txt/folder" node scripts/buildQuestionBank.js
```

## Optional: Prose Controls

Disable prose mining:

```bash
PASHA_INCLUDE_PROSE=0 node scripts/buildQuestionBank.js
```

Cap prose items per source file:

```bash
PASHA_MAX_PROSE_PER_FILE=1200 node scripts/buildQuestionBank.js
```

## Filter Categories in the App

The filter lists are generated from `data/pasha-question-bank.json`:

- `chapter` comes from chapter headers in each source extract.
- `section` comes from detected subchapter headings and auto-narrows to your current topic/chapter selection.
- `organ system`, `disease domain`, and `focus area` are rule-based tags derived from each fact's text.
- If no rule match exists for organ system, the app uses a topic-based fallback.
- Tags are heuristic; they are designed for fast studying/filtering, not as a perfect ontology.
