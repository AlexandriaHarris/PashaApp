# Novelty Pass Prompt

Run this before drafting each chapter to reduce rehash risk and improve originality.

## Goal

Generate chapter-level novelty that feels surprising yet inevitable within canon.

## Inputs

1. `templates/chapter-request-template.md`
2. `outline.md`
3. `themes.md`
4. `style_guide.md`
5. `novelty_ledger.md` (if missing, initialize from `templates/novelty-ledger-template.md`)
6. `chapter_memory_log.md`
7. Last 1-3 chapter summaries or draft excerpts

## Procedure

1. Detect repetition risk
- Compare planned chapter against recent chapters and novelty ledger.
- Flag likely repeats in beat sequence, conflict geometry, reveal style, imagery clusters, and phrasing habits.

2. Generate novelty vectors
- Create 3 distinct vectors, each with:
  - plot novelty move
  - emotional novelty move
  - stylistic novelty move
- Keep vectors canon-safe and genre-appropriate.

3. Pressure-test vectors
- Reject vectors that break constraints or feel random.
- Reject vectors that merely remix surface details of recent chapters.

4. Select chapter novelty plan
- Choose one primary and one secondary novelty move.
- Record expected impact on tension, character change, and theme progression.

5. Define anti-rehash guardrail
- List banned repeat elements for this chapter.
- List any intentional echoes and why they are justified.

## Output Contract

Return a concise novelty plan section containing:
- `primary_novelty_move`
- `secondary_novelty_move`
- `banned_rehash_elements`
- `intentional_echoes`
- `risk_notes`
- `linked_notes`: [[novelty_ledger]], [[outline]], [[themes]], [[style_guide]]
