# Conflict Resolution Rules

## Rule 1: Soft Warn First

When canon conflict is detected, do not hard-stop by default. Provide a concise warning and ask for decision.

## Rule 2: Block Only Material Contradictions

Use `block` only for contradictions that would materially damage continuity, such as:
- impossible timeline
- broken world-rule logic
- character behavior violating established hard constraints

## Rule 3: Ask Explicit Decision Questions

For each `warn` or `block`, provide:
- option A: preserve canon
- option B: accept override
- option C: defer and draft alternative

## Rule 4: Canon Update Logging

If user approves override, append a structured entry to `canon_changelog.md`.

## Rule 5: No Silent Retcon

Do not rewrite source canon files without explicit user instruction. Use append-only changelog as default.

## Rule 6: Re-check After Decision

After user selects resolution, rerun continuity check on impacted passages before finalizing output.

## Rule 7: Handle Rehash Risk Explicitly

When rehash risk is detected:
- option A: revise now for novelty
- option B: keep as intentional echo with rationale
- option C: defer and propose alternate novelty vectors

Log approved intentional echoes and banned repeat elements in `novelty_ledger.md`.

## Rule 8: Resolve Knowledge and Inventory Conflicts

When knowledge or inventory continuity conflicts are detected:
- option A: revise chapter events to match existing `knowledge_map.md`
- option B: update `knowledge_map.md` with evidence-backed chapter change
- option C: mark uncertain and ask a targeted follow-up question

Always keep active-character updates ordered as primary first, secondary second.
