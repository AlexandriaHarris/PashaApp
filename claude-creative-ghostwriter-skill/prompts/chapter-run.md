<chapter_run>
Execute this protocol for every chapter request.
</chapter_run>

<inputs>
Use `templates/chapter-request-template.md`:
- chapter_number
- goal_for_chapter
- must_include
- must_avoid
- point_of_view
- active_primary_characters
- active_secondary_characters
- quality_mode
- target_length
- style_intent_for_chapter
- allowed_style_deviation
- novelty_target
- banned_rehash_elements
- intentional_echoes
- quality_gate_threshold
- relevant_notes
</inputs>

<phase_plan>
1. Build five-beat map: Hook, Escalation, Turn, Climax, Aftermath.
2. Anchor each beat to canon references.
3. Validate against story constraints relevant to the genre/context:
- speculative rules when present
- social/legal/institutional realism constraints when applicable
4. Validate style plan against `style_guide.md` and chapter-level style intent.
5. Run `prompts/novelty-pass.md` and propose three novelty vectors.
6. Select one primary and one secondary novelty move.
7. Flag contradictions as warn or block.
8. Check recent entries in `chapter_memory_log.md` for repetition risk.
9. Treat only locked confirmed entries in `world_fact_registry.md` as hard world canon.
</phase_plan>

<phase_draft>
1. Draft to target length and quality mode.
2. Honor style guide, voice profile, and prose sliders.
3. If `allowed_style_deviation` is empty, enforce style guide strictly.
4. Execute selected novelty moves while preserving canon and character logic.
5. Preserve chapter goal, POV, and approved canon decisions.
</phase_draft>

<phase_continuity_qa>
1. Run continuity-check prompt.
2. Return findings with severity and candidate resolutions, including style drift, rehash-risk, and AI-prose tell findings.
3. Pause for user decision on unresolved warn/block findings.
</phase_continuity_qa>

<phase_revise>
1. Apply approved decisions.
2. Improve pacing, clarity, and language to requested quality mode.
3. Run anti-rehash pass against the last 3 chapters and `novelty_ledger.md`.
4. Run `prompts/anti-ai-prose-check.md` and rewrite flagged passages.
5. Run `prompts/quality-gate.md` and score with `templates/chapter-scorecard-template.md`.
6. If score fails threshold, revise and rescore.
7. Append entry to `chapter_memory_log.md` using `templates/chapter-memory-log-template.md`.
8. Run `prompts/knowledge-inventory-update.md` and append chapter update to `knowledge_map.md`.
9. Return final chapter and compact decision log.
</phase_revise>

<task_cadence_check>
After revise, decide whether to continue the current task or start a new one.
Default: start a new task after every 2 completed chapters.
Force new task after this chapter if high-risk signals exist:
- unresolved warn/block findings
- major canon override approvals
- large timeline/location state changes
- major style deviation from baseline contract
Allow extension to chapter 3 only if risk remains low and continuity is stable.
Never continue past chapter 3 in the same task.
</task_cadence_check>

<response_footer>
Always end with:
<obsidian_update>
- New facts introduced
- Canon conflicts resolved
- Canon changes approved for changelog append
- Novelty moves attempted and outcomes
- Rehash risks detected and mitigations
- AI-prose tells detected and rewrites applied
- Quality gate score and pass/fail status
- Knowledge/inventory updates written to [[knowledge_map]]
- Relevant note links in [[wikilink]] format
- Task cadence recommendation: continue | open_new_task
- If open_new_task, include startup load list [[outline]], [[character_bible]], [[style_guide]], [[knowledge_map]], [[novelty_ledger]], [[chapter_memory_log]], [[timeline]], [[canon_changelog]]
If none: No updates needed.
</obsidian_update>
</response_footer>
