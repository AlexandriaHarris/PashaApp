---
name: claude-creative-ghostwriter
description: Claude cowork ghostwriting workflow for fiction projects with worldbuilding-first onboarding, chapter planning, drafting, continuity QA, and revision. Use when creating or maintaining story bible files, generating chapter drafts, minimizing narrative drift, resolving canon conflicts, and logging approved canon updates in an append-only changelog.
---

# Claude Creative Ghostwriter

Follow this workflow exactly for fiction projects.

## Core Defaults

- Default `worldbuilding_mode`: ask user to choose `initial_setup` or `incremental_setup` at kickoff.
- Default `quality_mode`: `scene`.
- Default `target_length`: `1800-2500` words.
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
- `canon_changelog.md`

If files are missing, scaffold from templates in `templates/world/`.

## Phase 0: Worldbuilding Onboarding

1. Run the guided interview in `prompts/worldbuilding-interview.md`.
2. Capture answers into world files using `prompts/world-doc-generator.md` and `templates/world/`.
3. Confirm `worldbuilding_mode`:
- `initial_setup`: require explicit approval checkpoint after generating world docs before chapter drafting.
- `incremental_setup`: begin chapter drafting and fill missing world docs only when needed.

## Phase 1: Chapter Plan

1. Use `templates/chapter-request-template.md` to collect chapter intent.
2. Build a five-beat map:
- Hook
- Escalation
- Turn
- Climax
- Aftermath
3. Validate plan against canon files and `canon_changelog.md`.
4. Ask clarifying questions only when contradictions materially affect continuity.

## Phase 2: Draft

1. Draft using selected `quality_mode`:
- `beat`: fast structural prose pass.
- `scene`: full scene-complete chapter draft.
- `polish`: near-publish language and rhythm.
2. Apply voice profile and prose sliders from templates.
3. Preserve outline trajectory, POV, and required chapter goals.

## Phase 3: Continuity QA

1. Produce a structured report with `info`, `warn`, `block` levels using `templates/continuity-report-template.md`.
2. For `warn` or `block`, pause and ask user whether to preserve canon or approve override.

## Phase 4: Revise

1. Apply approved conflict resolutions and polish pass.
2. If override is accepted, append a structured entry to `canon_changelog.md` using `templates/canon-changelog-template.md`.
3. Return final chapter plus short summary of unresolved risks, if any.

## Style System

Use `templates/voice-profile-template.md` and `templates/prose-sliders-template.md` whenever style is missing or vague. Ask user to set values, otherwise use defaults in the templates.

## Guardrails

- Never silently retcon canon.
- Never ignore user-approved overrides.
- Never invent hard facts already contradicted by approved changelog entries.
- Keep all canon changes auditable through append-only changelog entries.
