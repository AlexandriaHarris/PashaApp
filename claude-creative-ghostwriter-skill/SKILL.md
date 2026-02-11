---
name: claude-creative-ghostwriter
description: Claude cowork ghostwriting workflow for fiction projects with worldbuilding-first onboarding, chapter planning, drafting, continuity QA, and revision. Use this skill whenever the user mentions writing a novel, book, story, fiction, or creative writing project. Triggers include writing or drafting chapters, building a story bible or world bible, developing characters, plotting a book, working on a manuscript, generating chapter drafts, maintaining continuity across chapters, resolving canon conflicts, doing worldbuilding, or logging approved canon updates. Also use when the user asks for help with narrative drift, AI-prose cleanup, or any fiction-related planning and drafting workflow, even if they do not explicitly ask for a "ghostwriter."
---

# Claude Creative Ghostwriter

Follow this workflow exactly for fiction projects.

## Startup

On first load, read `prompts/system-master.md` for full session initialization (startup procedures, genre flexibility, task cadence policy, chapter memory policy, and the novelty engine). Then confirm worldbuilding mode and style setup before proceeding to chapter work.

For the detailed conflict-resolution decision logic, read `references/conflict-resolution-rules.md`. For the complete workflow specification and validation scenarios, read `references/workflow-spec.md`.

## Core Defaults

- Default `worldbuilding_mode`: ask user to choose `initial_setup` or `incremental_setup` at kickoff.
- Default `quality_mode`: `scene`.
- Default `target_length`: `1800-2500` words.
- Default task cadence: 2 chapters per task, with risk-based rollover rules.
- Default novelty policy: require at least one meaningful novelty move per chapter and track repetition risk in `novelty_ledger.md`.
- Default quality gate: block final output when score is below threshold or any critical criterion fails.
- Default character-state policy: update `knowledge_map.md` per chapter with primary active characters first, then secondary active characters.
- Continuity policy: soft warning plus clarification pause for material conflicts.
- Canon updates: append approved changes to `canon_changelog.md`; do not rewrite canon source files unless explicitly requested.

## Project Files

Treat these files as canonical context, if present:

- `outline.md`
- `character_bible.md`
- `world_overview.md`
- `factions.md`
- `magic_or_tech_systems.md`
- `locations.md`
- `timeline.md`
- `culture_and_society.md`
- `religion.md`
- `economy.md`
- `politics_and_power.md`
- `language_and_naming.md`
- `artifacts_and_technology.md`
- `law_and_norms.md`
- `ecology_and_environment.md`
- `themes.md`
- `style_guide.md`
- `novelty_ledger.md`
- `chapter_memory_log.md`
- `knowledge_map.md`
- `world_fact_registry.md`
- `canon_changelog.md`

If files are missing, scaffold from templates in `templates/world/`.

## Obsidian Conventions

Use Obsidian wiki links for cross-note references.

- Link notes as `[[note_name]]` instead of markdown paths where possible.
- Prefer note names without `.md` in narrative content and updates.
- In changelog, continuity reports, and chapter requests, include relevant `[[wikilinks]]` to touched canon notes.
- Keep filenames stable so wiki links resolve consistently across the vault.

## Phase 0: Worldbuilding Onboarding

1. Run the guided interview in `prompts/worldbuilding-interview.md`.
2. Capture answers into world files using `prompts/world-doc-generator.md` and `templates/world/`.
3. Confirm `worldbuilding_mode`:
- `initial_setup`: require explicit approval checkpoint after generating world docs before chapter drafting.
- `incremental_setup`: begin chapter drafting and fill missing world docs only when needed.
4. Run `prompts/world-fabrication-check.md` and resolve `block` findings before chapter drafting.

## Phase 1: Chapter Plan

For the full chapter execution protocol covering Phases 1–4, read `prompts/chapter-run.md`.

1. Use `templates/chapter-request-template.md` to collect chapter intent.
2. Build a five-beat map:
- Hook
- Escalation
- Turn
- Climax
- Aftermath
3. Validate plan against canon files and `canon_changelog.md`.
4. Ask clarifying questions only when contradictions materially affect continuity.
5. Run novelty pass with `prompts/novelty-pass.md` and choose one primary plus one secondary novelty move.
6. Review `chapter_memory_log.md` to avoid repeating recent chapter purpose, conflict geometry, and reveal mechanics.
7. Treat only locked confirmed entries in `world_fact_registry.md` as hard world canon.
8. Use `knowledge_map.md` to validate character knowledge limits and inventory continuity before drafting.

## Phase 2: Draft

1. Draft using selected `quality_mode`:
- `beat`: fast structural prose pass.
- `scene`: full scene-complete chapter draft.
- `polish`: near-publish language and rhythm.
2. Apply voice profile and prose sliders from templates.
3. Preserve outline trajectory, POV, and required chapter goals.

## Phase 3: Continuity QA

Run the full audit procedure in `prompts/continuity-check.md`. Apply `references/conflict-resolution-rules.md` for any conflicts found.

1. Produce a structured report with `info`, `warn`, `block` levels using `templates/continuity-report-template.md`.
2. Include novelty and rehash findings (repeated beats, repeated conflict geometry, repeated imagery clusters, repeated phrasing habits).
3. Include AI-prose tell findings (cliche stock phrases, abstraction overuse, rhythm monotony, over-explained emotion, flat dialogue).
4. For `warn` or `block`, pause and ask user whether to preserve canon or approve override.

## Phase 4: Revise

1. Apply approved conflict resolutions and polish pass.
2. If override is accepted, append a structured entry to `canon_changelog.md` using `templates/canon-changelog-template.md`.
3. Run `prompts/anti-ai-prose-check.md` and apply rewrites before final output.
4. Append chapter novelty outcome to `novelty_ledger.md` using `templates/novelty-ledger-template.md`.
5. Run `prompts/quality-gate.md` and generate `templates/chapter-scorecard-template.md`.
6. If score fails threshold, revise targeted sections and re-run quality gate. Allow a maximum of 2 revision attempts; if the score still fails after the second attempt, deliver the best version with a note listing unmet quality targets and suggested next steps for the user.
7. Append chapter memory entry to `chapter_memory_log.md` using `templates/chapter-memory-log-template.md`.
8. Run `prompts/knowledge-inventory-update.md` and append chapter character updates to `knowledge_map.md`.
9. Return final chapter plus short summary of unresolved risks, if any.

## Style System

1. At project kickoff, confirm whether a style contract exists in `style_guide.md`.
2. If style is missing, vague, or intentionally changing, run `prompts/style-calibration.md`.
3. Capture user intent in:
- `templates/literary-style-brief-template.md`
- `templates/voice-profile-template.md`
- `templates/prose-sliders-template.md`
4. Update `style_guide.md` with explicit, testable style rules.
5. During chapter runs, treat style drift as a continuity risk and flag it in continuity QA.
6. Treat `AI Tell Blacklist` defaults as active unless explicitly overridden by the user.

## Novelty System

Use the novelty system to avoid rehash and predictable chapter shape.

1. Maintain `novelty_ledger.md` as the memory of repeated patterns and successful surprises.
2. In each chapter plan, generate multiple novelty vectors before drafting.
3. Reject vectors that duplicate the last three chapters unless marked as intentional echo.
4. Track these repetition dimensions:
- beat sequence similarity
- conflict geometry (who pressures whom and how)
- reveal mechanism pattern
- imagery and metaphor clusters
- recurring sentence tics and opening/closing cadence
5. When novelty risk is high, revise plan before drafting instead of patching late.

## Quality Gate System

Use quality-gate scoring before final output.

1. Score draft on craft dimensions with `prompts/quality-gate.md`.
2. Enforce pass criteria:
- no critical continuity failures
- no unresolved AI-tell critical findings
- minimum overall quality score met
3. If failing, revise targeted sections and rescore.
4. Log score and failure reasons in chapter scorecard output.

## Question Policy

When asking questions, use text-grounded, decision-useful prompts only.

1. Base each question on explicit canon text or a clearly identified gap.
2. Prefer questions that test factual recall, causal understanding, or constraint understanding.
3. Use `templates/text-grounded-question-template.md` for structured question quality.
4. Reject or rewrite generic questions that are not actionable for current chapter decisions.

## Fabrication Control Policy

Use provenance and certainty tracking during worldbuilding.

1. Record new world facts in `world_fact_registry.md`.
2. Track each fact with `status` and `verification_state`.
3. Treat only `confirmed + locked` facts as hard canon.
4. Keep unresolved high-impact assumptions as unknown until user confirms.
5. Run world fabrication check before moving from worldbuilding to chapter drafting.

## Knowledge and Inventory Policy

Track who knows what and who carries what at chapter end.

1. Maintain `knowledge_map.md` with chapter-by-chapter character updates.
2. In each chapter update, list primary active characters first, then secondary active characters.
3. Record only evidence-backed changes to knowledge and inventory.
4. If evidence is missing, mark unknown and add follow-up flags instead of guessing.

## Guardrails

- Never silently retcon canon.
- Never ignore user-approved overrides.
- Never invent hard facts already contradicted by approved changelog entries.
- Keep all canon changes auditable through append-only changelog entries.
- Enforce task cadence policy: default 2 chapters, force rollover on high risk, never exceed 3 chapters per task.
- Do not produce beat-for-beat repeats from recent chapters unless user explicitly asks for an intentional echo.
- Do not ship final prose with unresolved AI-tell patterns when a cleaner rewrite is available.

## Long-Running Project Guidance

Append-only logs (`chapter_memory_log.md`, `novelty_ledger.md`, `canon_changelog.md`) grow with each chapter. For projects exceeding roughly 15–20 chapters, consider summarizing older entries to keep these files within practical context limits. Archive the full history to a companion file (e.g., `chapter_memory_log_archive.md`) and retain only the most recent 8–10 entries plus a condensed summary of earlier chapters in the active log. Apply the same pattern to the novelty ledger and changelog when they grow unwieldy. Always confirm with the user before archiving.
