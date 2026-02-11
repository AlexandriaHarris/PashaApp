# Pasha Inservice Arena — Question Quality Rebuild Plan

## Problem Summary

The app works well mechanically (filtering, Kadoo mode, scoring, timers, OpenEvidence links), but the questions are weak because:

1. **~23% of facts are garbage** — generic heading terms ("Complications", "Types", "Management") with no parent context, OCR artifacts ("ooff" instead of "of"), reference-only definitions ("see p. 7"), malformed/truncated terms
2. **All question modes are the same thing** — term→definition, definition→term, or cloze fill-in. Every question is surface-level "what does X mean"
3. **Distractors are random** — pulled from peer facts by section/topic proximity, not by clinical plausibility or semantic similarity. A question about thyroid cancer might have distractors about nasal anatomy
4. **No difficulty curve** — every question is equally weighted, no way to focus on weak areas
5. **No learning feedback** — wrong answers just say "Incorrect" with no teaching moment

## Approach: Two-phase rebuild

### Phase 1: Clean the data (buildQuestionBank.js)

**1a. Fix OCR artifacts**
- The existing `maybeUndoubleWord()` misses 95+ "ooff" patterns — fix the detection to catch partial doubles and common OCR substitutions
- Add a second-pass cleanup for known patterns: "ooff"→"of", "ttoo"→"to", "aanndd"→"and", "tthhee"→"the"
- Strip doubled parentheses: `((text))` → `(text)`

**1b. Contextualize generic heading terms**
- When a fact's term is a generic heading (Management, Complications, Types, History, Symptoms, etc.), prepend the most specific parent section heading
- Example: term "Complications" in section "Septal Hematoma" becomes "Septal Hematoma — Complications"
- This affects ~414 facts (6.6%) that are currently ambiguous

**1c. Filter garbage facts**
- Remove reference-only definitions: "see p. X", "see below", "see above" (5 known facts)
- Remove facts where definition is a pure list of abbreviations with no explanatory content
- Remove facts where term is a bare number or has no vowels (noise)
- Tighten definition length floor from 8→20 chars minimum
- Remove facts with 4+ commas in definition AND no explanatory verb (likely raw lists, not facts)

**1d. Add quality tier metadata**
- Score each fact on: term specificity, definition informativeness, presence of clinical detail, explanatory verb presence
- Tag each fact as `tier: "high" | "medium" | "low"`
- High: specific term (not a heading) + definition with explanatory content + 100-400 chars
- Medium: reasonable term + adequate definition + 50-300 chars
- Low: everything else that passes the filter (keep for completeness, but deprioritize)

**1e. Add relationship tags between facts**
- Tag facts that share the same parent section as `siblings`
- Tag facts where one term appears in another's definition as `related`
- Store these as arrays on each fact: `siblingIds`, `relatedIds`
- This powers smarter distractor selection in Phase 2

### Phase 2: Improve the questions (app.js)

**2a. Smarter distractor selection**
- Replace random peer pool with tiered distractor strategy:
  1. First preference: siblings (same parent section) — these are the most confusable and therefore the most educational
  2. Second preference: same organ system + similar term length
  3. Third preference: same disease domain
  4. Fallback: any same-topic fact (current behavior)
- For typed cloze (percentages, measurements): already good — keep same-unit matching

**2b. New question mode: "Differentiation"**
- Present 2 related terms from the same section and ask "Which one is described by: [definition]?"
- Uses the sibling relationships from Phase 1
- This tests whether students can distinguish between commonly confused entities
- Example: "Which condition: keratin-producing squamous epithelium grows into the middle ear?" → Cholesteatoma vs. Tympanosclerosis vs. Otosclerosis vs. Chronic otitis media

**2c. New question mode: "Association"**
- Present a fact's definition and ask which clinical context it belongs to
- Uses the section/subsection hierarchy
- Example: "This finding is associated with which condition?" + definition → pick the correct parent condition
- Draws distractors from other conditions in the same chapter

**2d. Improve cloze construction**
- Current cloze blanks out typed tokens (percentages, measurements, stages) — this is good
- Add: blank out the key medical term when it appears within a longer definition
- Add: blank out the action/verb phrase ("treated with ___", "diagnosed by ___")
- Better stem trimming — current windowing sometimes cuts mid-concept

**2e. Richer post-answer feedback**
- On wrong answer: show the full fact (term + definition) as a learning card
- On wrong answer: if the fact has siblings, show a brief "Don't confuse with: [sibling term]" note
- On correct answer in timed mode: show a brief reinforcement fact from a related fact

**2f. Difficulty-weighted selection**
- Use the quality tiers from Phase 1 to weight random selection
- "Easy" round: draw 70% high-tier, 30% medium-tier facts
- "Standard" round: draw 40% high, 40% medium, 20% low
- "Hard" round: draw from all tiers but use Differentiation mode more often
- Add a difficulty selector to the setup panel (Easy / Standard / Hard)

**2g. Adaptive weak-area tracking**
- Store missed fact IDs in localStorage between sessions
- On subsequent rounds, bias selection toward previously-missed facts (spaced repetition lite)
- Show a "Review Missed" quick-start button on the setup panel if there are stored misses

## Files changed

| File | Changes |
|------|---------|
| `scripts/buildQuestionBank.js` | OCR fixes, heading contextualization, garbage filtering, quality tiers, relationship tags |
| `data/pasha-question-bank.json` | Regenerated with enriched data (need source .txt files mounted) |
| `data/pasha-question-bank.js` | Same as above, JS wrapper version |
| `app.js` | New question modes, smarter distractors, feedback, difficulty selector, adaptive tracking |
| `index.html` | Difficulty selector UI, review-missed button, feedback display area |
| `styles.css` | Styling for new feedback cards, difficulty selector, review button |

## What I need from you

1. **Mount the Pasha text extract source folder** so I can regenerate the question bank with the improved build script. The build script references: `/Users/Alex/Desktop/ENT practice tests/ENT Resources/Pasha_Text_Extracts`

2. **Confirm scope** — this plan keeps the existing app structure and adds to it. No framework changes, no dependencies, still a vanilla JS static site. Sound right?

## Order of work

1. Fix `buildQuestionBank.js` (Phase 1a–1e)
2. Regenerate question bank from source files
3. Update `app.js` with new question modes and distractor logic (Phase 2a–2d)
4. Add feedback system (Phase 2e)
5. Add difficulty selector and adaptive tracking (Phase 2f–2g)
6. Update HTML/CSS for new UI elements
7. Test by running the app locally
