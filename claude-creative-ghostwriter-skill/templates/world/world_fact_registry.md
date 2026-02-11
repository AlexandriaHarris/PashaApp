# World Fact Registry

## Purpose

Track provenance, certainty, and verification state of world facts. Only `confirmed + locked` entries are treated as hard canon during chapter drafting. All other entries remain soft until the user explicitly confirms them.

## Fact Entries

### Fact

- `fact_id`:
- `claim`:
- `source`: user_stated | interview_answer | inferred | generated
- `status`: draft | confirmed | deprecated
- `verification_state`: unlocked | locked
- `confidence`: high | medium | low
- `first_introduced`: chapter or session reference
- `impacted_notes`: [[world_overview]], [[character_bible]], [[timeline]]
- `notes`:

## Unresolved Assumptions

High-impact facts that remain unconfirmed. Keep here until user locks or revises them.

## Known Unknowns

## Linked Notes

- [[outline]]
- [[character_bible]]
- [[world_overview]]
- [[themes]]
- [[style_guide]]
- [[timeline]]
- [[canon_changelog]]
- [[novelty_ledger]]
