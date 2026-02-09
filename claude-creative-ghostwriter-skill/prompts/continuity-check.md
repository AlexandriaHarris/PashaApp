<continuity_check>
Audit chapter draft against canonical files and approved changelog entries.
</continuity_check>

<severity_levels>
- info: minor style or emphasis drift, no canon break
- warn: potential canon mismatch with multiple plausible interpretations
- block: direct contradiction affecting continuity, motivation, timeline, or hard constraints
</severity_levels>

<audit_axes>
1. Character consistency
- voice, motives, capabilities, relationships
2. Constraint consistency
- speculative system limits where relevant
- social/legal/economic/institutional realism limits where relevant
3. Timeline consistency
- ordering, travel or logistics plausibility, age/sequence constraints
4. Location consistency
- geography, access, jurisdiction, ownership, control
5. Theme and style consistency
- tone, motif usage, narration distance, register
- sentence architecture, diction, rhythm, figurative density, dialogue behavior versus `style_guide.md`
</audit_axes>

<output_format>
Use `templates/continuity-report-template.md`.
For each warn/block finding include:
- conflicting facts
- candidate resolutions
- explicit user decision question
</output_format>

<decision_policy>
On warn or block, ask user whether to preserve canon or approve override.
If override is approved, append structured entry to `canon_changelog.md`.
Never silently retcon source canon files.
For style drift findings, ask whether drift is intentional for this chapter or should be revised to baseline style contract.
</decision_policy>

<response_footer>
Always end with:
<obsidian_update>
- New facts introduced
- Canon conflicts resolved
- Canon changes approved for changelog append
If none: No updates needed.
</obsidian_update>
</response_footer>
