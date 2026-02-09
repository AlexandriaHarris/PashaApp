---
name: mcat-flashcard-question-planner
description: Build high-quality MCAT study plans, flashcard sets, and practice question sets with coverage balancing across Chemical and Physical Foundations, CARS, Biological and Biochemical Foundations, and Psychological/Social Foundations. Use when creating or improving MCAT prep content, spaced-repetition card queues, passage/question batches, or weekly study sequencing for the ENT Practice App website.
---

# MCAT Flashcard and Question Planning

Follow this workflow when generating study content.

## 1) Establish scope and constraints

Collect and restate:
- Target exam date or preparation window.
- Hours per week and preferred study cadence.
- Current strengths and weak areas by MCAT section.
- Content format needed: flashcards, standalone questions, passage sets, or mixed.
- Difficulty target: foundational, medium, or exam-like.

If user data is incomplete, choose conservative defaults and label assumptions.

## 2) Build a coverage map before writing items

Allocate study items across the four MCAT sections:
- Chemical and Physical Foundations (`CP`)
- Critical Analysis and Reasoning Skills (`CARS`)
- Biological and Biochemical Foundations (`BB`)
- Psychological, Social, and Biological Foundations (`PS`)

Use proportional coverage rather than over-focusing one section unless the user asks for targeted remediation.

For topic-level guidance, read `references/mcat-topic-map.md`.

## 3) Generate flashcards that test retrieval, not recognition

Use these card rules:
- Write one testable idea per card.
- Prefer prompt formats that require recall (definition from cue, mechanism from outcome, interpretation from data).
- Keep front text concise; keep back text complete but not verbose.
- Include a short rationale or memory anchor when confusion risk is high.
- Tag every card with section and topic metadata.

Avoid:
- Multi-fact trivia stacks on one card.
- Ambiguous phrasing with multiple plausible answers.
- Cards that only ask for yes/no recognition.

## 4) Generate questions with defensible answer logic

For each multiple-choice item:
- Define a single best answer and three plausible distractors.
- Ensure distractors represent realistic errors (concept confusion, unit/sign error, overgeneralization).
- Provide a concise explanation for the correct answer and a short reason each distractor is wrong.
- Tag difficulty and estimated solve time.

For passage-based sets:
- Create a compact passage with enough data to answer each item.
- Avoid hidden assumptions that are not inferable from the passage or core MCAT knowledge.

## 5) Sequence study workload for retention

Plan weekly mixes that include:
- New content acquisition.
- Timed retrieval practice.
- Review cycles for older items.

Default spaced review intervals:
- Day 1, Day 3, Day 7, Day 14, Day 30.

Increase repetition frequency for missed or low-confidence items.

## 6) Emit app-ready output

Return output in structured JSON-like blocks compatible with ENT Practice App ingestion.

Use `references/output-templates.md` for:
- Flashcard item schema.
- MCQ item schema.
- Weekly plan schema.

Always include:
- Stable `id` values.
- `section`, `topic`, and `difficulty`.
- Explanations for questions.
- `source` value set to `"generated-by-mcat-flashcard-question-planner"`.

## 7) Run quality checks before finalizing

Check each batch for:
- Coverage balance against requested goals.
- Clear, unambiguous wording.
- Single-best-answer integrity.
- Explanation quality and educational value.
- Duplicates and near-duplicates.

If a batch fails checks, revise before returning.
