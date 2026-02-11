# Anti-AI Prose Check Prompt

Run this after drafting and before final output.

## Goal

Detect and rewrite common AI-writing artifacts while preserving canon, voice, and narrative intent.

## Inputs

1. Current chapter draft
2. `style_guide.md`
3. `voice-profile-template` values in use
4. Latest continuity findings

## Detection Checklist

1. Abstraction overload
- Vague emotional statements without concrete scene behavior.

2. Cliche and stock phrasing
- Overfamiliar expressions, empty intensifiers, and template-like metaphor strings.

3. Rhythm monotony
- Repetitive sentence openings, uniform sentence length, or predictable cadence loops.

4. Explanatory overtalk
- Telling motivations or subtext directly when dramatization would be stronger.

5. Dialogue flattening
- Lines that read as exposition delivery instead of character-specific speech.

## Rewrite Rules

- Preserve plot facts, canon constraints, and approved novelty moves.
- Replace generic abstractions with concrete sensory/action detail.
- Vary sentence architecture in line with `style_guide.md`.
- Cut redundant explanation; preserve ambiguity where subtext is intended.
- Keep character voices distinct and situation-specific.

## Output Contract

Return:
- `ai_tells_found`: yes | no
- `flagged_examples`:
- `rewrite_actions_taken`:
- `residual_risk`:
- `linked_notes`: [[style_guide]], [[character_bible]], [[novelty_ledger]], [[chapter_memory_log]]
