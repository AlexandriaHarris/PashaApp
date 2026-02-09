---
name: adaptive-learning-linker
description: Link readings, flashcards, and questions through adaptive progression rules for learning apps. Use when defining or implementing unlock logic, remediation recommendations, or event-driven content sequencing based on missed questions, reading completion, and topic-level performance trends.
---

# Adaptive Learning Linker

Use this skill to turn learner activity into deterministic next actions.

## Workflow

1. Normalize learner events
- Read `references/event-model.md` and convert raw app data into the canonical fields.
- Ensure each question attempt has `question_type`, `correct`, and `answered_at`.

2. Resolve unlock actions
- If a question is missed, unlock linked flashcards for that `question_type`.
- If a reading is completed, unlock linked flashcards and linked question sets.
- Do not emit duplicate unlocks for content already unlocked.

3. Resolve remediation recommendations
- Group recent attempts by `question_type`.
- Mark a type as struggling when attempt count and accuracy/streak thresholds are crossed.
- Recommend mapped readings for each struggling type.

4. Emit app-ready actions
- Return actions as a list of objects with `action`, `content_type`, `content_id`, and `reason`.
- Use `references/output-contract.md` for payload format.

5. Enforce safety checks
- Never lock already-unlocked content.
- Never recommend a reading already completed unless `allow_repeat_recommendation` is explicitly true.
- Keep thresholds configurable; do not hardcode business constants in responses.

## Decision Rules

Apply these default rules unless caller config overrides them:
- `missed_question_unlocks_flashcards`: true
- `reading_completion_unlocks_flashcards`: true
- `reading_completion_unlocks_questions`: true
- `struggle_min_attempts`: 5
- `struggle_max_accuracy`: 0.60
- `struggle_incorrect_streak`: 3
- `analysis_window`: 20 recent attempts per question type

## Scripted Engine

Use `scripts/evaluate_progression.py` when deterministic evaluation is needed.

Command:
```bash
python3 scripts/evaluate_progression.py --snapshot /path/to/snapshot.json --map /path/to/content-map.json --out /path/to/actions.json
```

Behavior:
- Reads learner snapshot and content mapping.
- Computes unlock and recommendation actions from the rules above.
- Writes JSON to stdout or `--out`.

## References

- `references/event-model.md`: canonical input schema and mapping notes.
- `references/output-contract.md`: required output action schema.
