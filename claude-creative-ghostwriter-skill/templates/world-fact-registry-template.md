# World Fact Registry

Track world canon provenance and certainty to prevent fabrication drift.

---
- `fact_id`:
- `fact_statement`:
- `domain`: world | faction | rules | location | timeline | culture | politics | economy | religion | language | ecology | other
- `status`: confirmed | inferred | unknown
- `verification_state`: locked | needs_confirmation
- `source_type`: user_statement | canon_note | inference
- `source_reference`: [[note_name]] or "user-confirmed in session"
- `last_verified_context`: worldbuilding | chapter_X | revision
- `impact_level`: low | medium | high
- `notes`:

## Guardrails

- Only `status=confirmed` + `verification_state=locked` should be treated as hard canon.
- `inferred` or `unknown` facts must not be silently promoted to hard canon.
