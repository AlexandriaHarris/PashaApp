# Quality Gate Prompt

Run this after revise and before final output.

## Goal

Apply a measurable pass/fail gate so chapters meet quality standards consistently.

## Inputs

1. Final revised chapter draft
2. `style_guide.md`
3. `knowledge_map.md`
4. `novelty_ledger.md`
5. `chapter_memory_log.md`
6. Latest continuity and AI-prose findings
7. `quality_gate_threshold` from chapter request (default 80)

## Scoring Rubric (0-100)

1. Continuity integrity (weight 30)
- Canon consistency, timeline coherence, no unresolved contradictions, and no knowledge/inventory continuity breaks.

2. Voice and style fidelity (weight 20)
- Match to style contract, character voice integrity, sentence-level control.

3. Novelty and anti-rehash quality (weight 20)
- Distinct chapter function, fresh conflict/reveal mechanics, no stale repetition.

4. Dramatic effectiveness (weight 20)
- Scene tension, emotional movement, causal clarity, chapter-end propulsion.

5. AI-prose hygiene (weight 10)
- Minimal cliche stock phrasing, limited abstraction bloat, no robotic dialogue patterns.

## Pass Criteria

- Overall score >= `quality_gate_threshold` (default 80)
- Continuity integrity >= 85
- Voice and style fidelity >= 80
- Novelty and anti-rehash quality >= 75
- AI-prose hygiene >= 85
- No critical unresolved finding

## Output Contract

Output `templates/chapter-scorecard-template.md` with:
- category scores
- weighted total
- pass/fail
- top failure reasons
- exact rewrite targets when failed
