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
6. Novelty and rehash risk
- beat sequence overlap with recent chapters
- repeated conflict geometry or reveal mechanics
- repeated imagery/metaphor clusters and phrase habits
- novelty target fulfillment versus `novelty_ledger.md`
7. AI-prose tell patterns
- generic abstraction over concrete action
- cliche phrasing and template-like metaphor chains
- repetitive sentence openings or cadence
- over-explained emotions and subtext
- dialogue that sounds informational rather than character-specific
8. Chapter-memory repetition risk
- repeated chapter purpose/outcome pattern versus `chapter_memory_log.md`
- repeated scene-open and scene-close shape versus recent entries
9. Fabrication risk
- use of world facts not locked in `world_fact_registry.md`
- inferred facts presented as hard canon
10. Knowledge and inventory continuity
- character acts on information not present in their chapter knowledge path (`knowledge_map.md`)
- inventory appears, disappears, or changes owner without chapter evidence
</audit_axes>

<output_format>
Use `templates/continuity-report-template.md`.
For each warn/block finding include:
- conflicting facts
- candidate resolutions
- explicit user decision question grounded in the conflicting text
- impacted note links in [[wikilink]] format
For novelty findings include:
- repeated element evidence
- whether repeat is accidental or intentional echo
- one concrete rewrite direction
For AI-prose findings include:
- exact phrase or sentence-level evidence
- why it reads as an AI tell
- one concrete rewrite direction grounded in style guide and character voice
For knowledge/inventory findings include:
- impacted character(s)
- expected knowledge/inventory state versus observed state
- one concrete correction to `knowledge_map.md` or chapter text
</output_format>

<decision_policy>
On warn or block, ask user whether to preserve canon or approve override.
Decision questions must:
- cite the exact conflict in plain language (what canon says vs what draft says)
- test understanding by requiring a concrete choice with consequence
- provide 2-3 actionable options (preserve, override, or draft alternative)
- include expected downstream impact (which notes/chapters are affected)
If override is approved, append structured entry to `canon_changelog.md`.
Never silently retcon source canon files.
For style drift findings, ask whether drift is intentional for this chapter or should be revised to baseline style contract.
For rehash findings, ask whether to revise for novelty now or keep as intentional echo and log rationale in `novelty_ledger.md`.
For AI-prose findings, default action is revise now unless user explicitly accepts the line as intentional stylistic choice.
</decision_policy>

<response_footer>
Always end with:
<obsidian_update>
- New facts introduced
- Canon conflicts resolved
- Canon changes approved for changelog append
- Novelty and rehash findings summary
- AI-prose tell findings summary and fixes
- Knowledge and inventory continuity findings summary
- Relevant note links in [[wikilink]] format
If none: No updates needed.
</obsidian_update>
</response_footer>
