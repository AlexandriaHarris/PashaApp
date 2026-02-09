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
- quality_mode
- target_length
- style_intent_for_chapter
- allowed_style_deviation
</inputs>

<phase_plan>
1. Build five-beat map: Hook, Escalation, Turn, Climax, Aftermath.
2. Anchor each beat to canon references.
3. Validate against story constraints relevant to the genre/context:
- speculative rules when present
- social/legal/institutional realism constraints when applicable
4. Validate style plan against `style_guide.md` and chapter-level style intent.
5. Flag contradictions as warn or block.
</phase_plan>

<phase_draft>
1. Draft to target length and quality mode.
2. Honor style guide, voice profile, and prose sliders.
3. If `allowed_style_deviation` is empty, enforce style guide strictly.
4. Preserve chapter goal, POV, and approved canon decisions.
</phase_draft>

<phase_continuity_qa>
1. Run continuity-check prompt.
2. Return findings with severity and candidate resolutions, including style drift findings.
3. Pause for user decision on unresolved warn/block findings.
</phase_continuity_qa>

<phase_revise>
1. Apply approved decisions.
2. Improve pacing, clarity, and language to requested quality mode.
3. Return final chapter and compact decision log.
</phase_revise>

<response_footer>
Always end with:
<obsidian_update>
- New facts introduced
- Canon conflicts resolved
- Canon changes approved for changelog append
If none: No updates needed.
</obsidian_update>
</response_footer>
