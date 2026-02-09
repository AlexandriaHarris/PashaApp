# Style Calibration Prompt

Run this whenever project style is missing, unclear, or intentionally changing.

## Goal

Convert user literary intent into enforceable style rules that survive long projects without drift.

## Inputs

1. `templates/literary-style-brief-template.md`
2. `templates/voice-profile-template.md`
3. `templates/prose-sliders-template.md`
4. Optional sample passages from user (positive and negative anchors)

## Procedure

1. Elicit style brief
- Fill every required field in the literary style brief.
- If user gives sample passages, extract traits (diction, rhythm, syntax, imagery, dialogue behavior) instead of imitating exact phrases.

2. Build style contract
- Update `style_guide.md` with:
  - non-negotiable style rules
  - allowed variation ranges
  - anti-patterns to avoid
  - chapter-level deviation policy

3. Align runtime controls
- Translate contract into voice profile and prose slider defaults.
- Note any genre-specific constraints (for example: realism requirements in contemporary fiction).

4. Output and confirm
- Return compact style summary and ask for explicit approval.
- Treat approved style contract as canon for chapter drafting and continuity QA.

## Rules

- Do not mimic living authors directly.
- Keep style rules measurable and testable.
- Prefer concrete constraints over vague descriptors.
