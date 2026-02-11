# Knowledge and Inventory Update Prompt

Run this at the end of each chapter after revise and quality gate pass.

## Goal

Append a chapter update to `knowledge_map.md` that tracks:
- what each active character knows at chapter end
- how that knowledge changed this chapter
- each active character's inventory changes

## Inputs

1. Final chapter draft
2. `templates/chapter-request-template.md` active character fields
3. `knowledge_map.md`
4. `character_bible.md`
5. `chapter_memory_log.md`

## Rules

1. Update only active characters for this chapter.
2. Order characters as:
- Primary active characters first, sorted by activity/impact in this chapter
- Secondary active characters next
3. For each character, record:
- knowledge before chapter
- knowledge gained or corrected this chapter
- knowledge at chapter end
- inventory at chapter start
- inventory gained / used / lost
- inventory at chapter end
- event evidence (scene actions that justify each change)
4. Do not infer inventory or knowledge changes without evidence in the chapter.
5. If evidence is unclear, mark the field as unknown and add a follow-up flag.

## Output

Append one `Chapter <number>` section under `## Chapter Character State Updates` in `knowledge_map.md`.
