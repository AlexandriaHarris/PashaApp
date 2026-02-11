# World Doc Generator Prompt

Convert interview answers and existing notes into canonical markdown files.

## Generation Rules

1. Create missing files from `templates/world/`.
2. Preserve existing confirmed canon.
3. Mark unresolved items clearly as open questions.
4. Keep details specific and actionable for chapter drafting.
5. Do not duplicate long sections across files; cross-reference concise anchors.
6. Use Obsidian `[[wikilink]]` references between related notes; avoid `.md` suffixes in note links.
7. If novelty preferences are provided, initialize or update `novelty_ledger.md` from `templates/novelty-ledger-template.md`.
8. If chapter memory tracking is missing, initialize `chapter_memory_log.md` from `templates/chapter-memory-log-template.md`.
9. If fact provenance tracking is missing, initialize `world_fact_registry.md` from `templates/world-fact-registry-template.md`.
10. Record source and certainty for every new or changed world fact in `world_fact_registry.md`.
11. Never convert inferred facts into confirmed canon without explicit user confirmation.
12. Keep low-certainty content in "Known Unknowns" until locked by user.
13. If `knowledge_map.md` is missing, initialize it from `templates/world/knowledge_map.md`.
14. Keep secret-level knowledge distribution current in `knowledge_map.md` during worldbuilding.

## Source Hierarchy

Use this priority order when establishing facts:
1. explicit user-confirmed statements in the current session
2. existing canonical note content with clear citation
3. if neither exists, mark as unknown (do not invent)

## Per-File Standards

- Begin with a short purpose statement.
- Use explicit facts, constraints, and examples.
- Include "Known Unknowns" section for unresolved decisions.
- Include "Chapter-Relevant Hooks" section to aid drafting.
- Include "Linked Notes" section with relevant `[[wikilinks]]`.
- Avoid unsourced claims; uncertain items must remain in Known Unknowns or inference notes.

## Mode Behavior

- `initial_setup`: produce comprehensive first pass for all world files.
- `incremental_setup`: update only files touched by current chapter needs, unless user asks for full pass.

## Post-Generation Check

1. Validate no contradictions with `character_bible.md`, `outline.md`, and `canon_changelog.md`.
2. If contradiction exists, produce soft warning and ask user to resolve.
3. On approval of override, append changelog entry.
4. Validate `knowledge_map.md` baseline entries align with character roles and known secrets.
5. Run `prompts/world-fabrication-check.md` and output a world fabrication report.
