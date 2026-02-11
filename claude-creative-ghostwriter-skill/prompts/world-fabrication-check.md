# World Fabrication Check Prompt

Run this after world doc generation and before approving canon for drafting.

## Goal

Detect unsourced, low-certainty, or contradictory world facts that can cause drift or fabrication.

## Inputs

1. Generated or updated world docs
2. `world_fact_registry.md`
3. Existing canon notes (`outline.md`, `character_bible.md`, `timeline.md`, etc.)
4. Current session user-confirmed decisions

## Checks

1. Unsourced fact detection
- Flag claims with no explicit source in `world_fact_registry.md`.

2. Certainty mismatch
- Flag facts marked inferred/unknown that appear as locked canon in world docs.

3. Contradiction risk
- Flag facts that conflict with existing canon or timeline logic.

4. Ambiguity risk
- Flag high-impact items with vague wording that could drift in later chapters.

## Output

Use `templates/world-fabrication-report-template.md` and classify findings:
- `block`: high-impact unsourced or contradictory canon
- `warn`: medium-risk uncertainty or ambiguity
- `info`: low-risk cleanup recommendation

For each `block` or `warn`, include:
- affected fact(s)
- source gap or conflict details
- one focused clarification question
- recommended action (`lock`, `revise`, `keep_unknown`)
