# Workflow Spec

## Startup

1. Detect available canon files.
2. Ask for worldbuilding mode selection.
3. If no world files exist, launch worldbuilding interview.

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
2. Draft: produce prose based on requested quality mode.
3. QA: output severity-scored continuity report.
4. Revise: incorporate approved fixes and finalize text.

## Quality Modes

- `beat`: skeletal prose and pacing-first structure.
- `scene`: full chapter with coherent scene construction.
- `polish`: near-publish sentence-level refinement.

## Default Output Targets

- Mode: `scene`
- Length: `1800-2500`

## Logging

Every approved canon override must be appended to `canon_changelog.md` with:
- timestamp
- changed canon statement
- impacted files
- reason
- approver

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
