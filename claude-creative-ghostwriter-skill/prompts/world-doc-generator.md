# World Doc Generator Prompt

Convert interview answers and existing notes into canonical markdown files.

## Generation Rules

1. Create missing files from `templates/world/`.
2. Preserve existing confirmed canon.
3. Mark unresolved items clearly as open questions.
4. Keep details specific and actionable for chapter drafting.
5. Do not duplicate long sections across files; cross-reference concise anchors.

## Per-File Standards

- Begin with a short purpose statement.
- Use explicit facts, constraints, and examples.
- Include "Known Unknowns" section for unresolved decisions.
- Include "Chapter-Relevant Hooks" section to aid drafting.

## Mode Behavior

- `initial_setup`: produce comprehensive first pass for all world files.
- `incremental_setup`: update only files touched by current chapter needs, unless user asks for full pass.

## Post-Generation Check

1. Validate no contradictions with `character_bible.md`, `outline.md`, and `canon_changelog.md`.
2. If contradiction exists, produce soft warning and ask user to resolve.
3. On approval of override, append changelog entry.
