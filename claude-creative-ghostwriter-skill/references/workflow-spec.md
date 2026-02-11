# Workflow Spec

## Startup

1. Detect available canon files.
2. Ask for worldbuilding mode selection.
3. If no world files exist, launch worldbuilding interview.
4. If style rules are missing or vague, run style calibration and update `style_guide.md`.
5. If `novelty_ledger.md` is missing, initialize it from `templates/novelty-ledger-template.md`.
6. If `chapter_memory_log.md` is missing, initialize it from `templates/chapter-memory-log-template.md`.
7. If `world_fact_registry.md` is missing, initialize it from `templates/world-fact-registry-template.md`.
8. If `knowledge_map.md` is missing, initialize it from `templates/world/knowledge_map.md`.

## Modes

### initial_setup

- Generate all world docs.
- Request explicit approval checkpoint.
- Start chapter runs only after approval.

### incremental_setup

- Generate only world docs relevant to active chapter tasks.
- Keep a running backlog of missing docs.
- Prompt user to fill missing docs when a chapter depends on them.

## Chapter Execution Contract

1. Plan: five-beat map with canon anchors.
2. Novelty pass: produce novelty vectors and reject high-rehash options.
3. Draft: produce prose based on requested quality mode and selected novelty moves.
4. QA: output severity-scored continuity report, including style drift, rehash-risk, and AI-prose tell checks.
5. Revise: incorporate approved fixes, run anti-AI prose pass, and finalize text.
6. Quality gate: score chapter and require pass threshold before delivery.
7. Log novelty outcomes in `novelty_ledger.md`.
8. Log chapter summary in `chapter_memory_log.md`.
9. Log character knowledge/inventory state updates in `knowledge_map.md` (primary active characters first, then secondary).
10. Questions: ask only text-grounded, decision-relevant questions; avoid generic prompts.
11. Worldbuilding fabrication check: block progression when high-impact unsourced facts remain unresolved.

## Quality Modes

- `beat`: skeletal prose and pacing-first structure.
- `scene`: full chapter with coherent scene construction.
- `polish`: near-publish sentence-level refinement.

## Default Output Targets

- Mode: `scene`
- Length: `1800-2500`
- Quality gate threshold: `80`

## Task Cadence Policy

- Default task window: 2 chapters per task.
- High-risk chapters trigger immediate task rollover (next chapter starts in a new task).
- Low-risk chapters may extend to chapter 3 maximum.
- Hard ceiling: never exceed 3 chapters in one task.

### High-Risk Signals

- unresolved continuity `warn` or `block` findings
- major canon overrides approved
- significant timeline or location-state shifts
- material style drift or approved style deviation from baseline
- high rehash risk or repeated novelty failures across recent chapters

### New-Task Startup Load Set

When rolling to a new task, load these notes first:
- `[[outline]]`
- `[[character_bible]]`
- `[[style_guide]]`
- `[[knowledge_map]]`
- `[[novelty_ledger]]`
- `[[chapter_memory_log]]`
- `[[timeline]]`
- `[[canon_changelog]]`

## Logging

Every approved canon override must be appended to `canon_changelog.md` with:
- timestamp
- changed canon statement
- impacted files
- reason
- approver

Every chapter should append novelty outcomes to `novelty_ledger.md` with:
- selected novelty moves
- detected rehash risks
- banned repeat elements for the next chapter
- intentional echoes and rationale

Every chapter should append compact memory outcomes to `chapter_memory_log.md` with:
- chapter purpose and outcome
- dominant conflict geometry
- reveal mechanism
- scene open/close pattern
- carry-forward hooks

Every chapter should append character state outcomes to `knowledge_map.md` with:
- primary active characters first, then secondary active characters
- knowledge before and after chapter
- inventory before and after chapter
- evidence-backed change notes

Worldbuilding should maintain `world_fact_registry.md` with:
- fact statement
- status and verification state
- source reference
- impact level

## Validation Scenarios

1. Worldbuilding bootstrap
- Empty project runs interview and generates world doc suite.

2. Mode switch behavior
- `initial_setup` enforces approval checkpoint before drafting.
- `incremental_setup` allows drafting while backfilling missing docs.

3. Conflict handling
- User direction conflicts with canon and triggers soft warning plus clarification.

4. Canon logging
- Approved overrides append structured entries to `canon_changelog.md`.

5. Multi-chapter drift check
- Three consecutive chapters keep stable continuity unless changelog says otherwise.

6. Quality mode differentiation
- `beat`, `scene`, and `polish` produce distinct depth and finish levels.

7. Novelty enforcement
- chapter plan includes novelty vectors and selected moves
- QA flags rehash risks with evidence
- novelty ledger updates after each chapter

8. AI-prose quality enforcement
- QA flags AI-tell patterns with evidence
- revise step rewrites flagged passages before final output

9. Quality gate enforcement
- scorecard produced each chapter
- failing score triggers targeted revision and rescore

10. Worldbuilding fabrication enforcement
- world fabrication report produced during onboarding
- unsourced high-impact facts blocked until locked or marked unknown

11. Knowledge/inventory continuity enforcement
- continuity QA flags impossible knowledge possession and inventory discontinuity
- chapter output includes knowledge_map updates

12. Active-character ordering enforcement
- chapter knowledge/inventory update lists primary active characters first
- secondary active characters appear after primary list
