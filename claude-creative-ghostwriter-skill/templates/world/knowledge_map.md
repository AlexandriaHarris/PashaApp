# Knowledge Map

## Purpose

Track information asymmetry and inventory state across chapters.
Use this file to answer:
- who knows what right now
- who does not know what
- what each active character is carrying at chapter end
- what changed this chapter and why

## How to Use

- Maintain two layers:
  1. secret-level map (global knowledge asymmetry)
  2. chapter-by-character update log (knowledge + inventory deltas)
- At end of each chapter, append a chapter update section.
- In each chapter section, list active characters by:
  1. primary active characters (most active first)
  2. secondary active characters
- During continuity QA, flag:
  - characters acting on knowledge they have not acquired
  - inventory appearing/disappearing without a chapter event

## Secrets

### Secret

- `secret_id`:
- `claim`: what the hidden information actually is
- `known_by`: characters, factions, or groups who hold this knowledge
- `unknown_to`: characters, factions, or groups who are blind to it
- `why_hidden`: why this information hasn't spread — suppression, isolation, cultural blindness, or deliberate concealment
- `reveal_trigger`: what event, encounter, or pressure could expose this secret
- `reveal_plan`: tentative chapter or arc beat where the reveal lands
- `narrative_stakes`: what changes emotionally, politically, or structurally when this is revealed
- `partial_clues`: hints, rumors, or gut feelings that exist before full reveal — breadcrumbs the reader or character might notice
- `status`: hidden | seeded | partially_revealed | fully_revealed
- `first_relevant_chapter`:
- `linked_notes`:

## Reveal Trajectory

Track the planned sequence of reveals across the story arc. Order matters — some secrets gate others.

| Order | Secret ID | Gated By | Target Arc Beat | Status |
|-------|-----------|----------|-----------------|--------|
|       |           |          |                 |        |

## Known Unknowns

## Chapter Character State Updates

### Chapter <number>

#### Primary Active Characters (most active first)

##### Character

- `character_name`:
- `knowledge_before_chapter`:
- `knowledge_gained_this_chapter`:
- `knowledge_corrected_or_lost`:
- `knowledge_at_chapter_end`:
- `inventory_at_chapter_start`:
- `inventory_gained`:
- `inventory_used_or_lost`:
- `inventory_at_chapter_end`:
- `evidence_events`:
- `carry_forward_flags`:
- `linked_notes`:

#### Secondary Active Characters

##### Character

- `character_name`:
- `knowledge_before_chapter`:
- `knowledge_gained_this_chapter`:
- `knowledge_corrected_or_lost`:
- `knowledge_at_chapter_end`:
- `inventory_at_chapter_start`:
- `inventory_gained`:
- `inventory_used_or_lost`:
- `inventory_at_chapter_end`:
- `evidence_events`:
- `carry_forward_flags`:
- `linked_notes`:

## Linked Notes

- [[outline]]
- [[character_bible]]
- [[world_overview]]
- [[factions]]
- [[culture_and_society]]
- [[world_fact_registry]]
- [[novelty_ledger]]
- [[timeline]]
- [[chapter_memory_log]]
- [[canon_changelog]]
