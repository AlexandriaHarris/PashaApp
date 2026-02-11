# Worldbuilding Interview Prompt

Use this interview to gather canonical world facts before writing chapters.

## Question Quality Standard

Ask only questions that are grounded in provided text or a clearly identified canon gap.

For each question:
- state why the question matters for chapter quality or continuity
- reference relevant notes using [[wikilinks]]
- avoid generic prompts that could apply to any story
- avoid asking for information already present in canon files

Ask in small batches (max 3 questions), then integrate answers before asking more.

## Fabrication Prevention Standard

For each accepted answer, immediately record:
- `source_basis`: direct user statement | existing canon note | unresolved
- `certainty`: confirmed | inferred | unknown
- `verification_state`: locked | needs_confirmation

Never silently upgrade inferred information to confirmed canon.
If user language is ambiguous, ask one targeted disambiguation question before canonizing.

When a source text/chapter excerpt is provided, include at least one knowledge-probe question that checks:
- factual recall (what is explicitly stated)
- causal understanding (why an event/choice happened)
- constraint understanding (what cannot happen under current canon)

## Interview Flow

1. Story frame
- Genre and subgenre
- Intended audience
- Tone and emotional promise
- Core themes

2. World fundamentals
- World concept in one sentence
- Time period and technology baseline
- What makes this world distinct

3. Power structures
- Governing powers
- Factions and rivalries
- Sources of social stability and unrest

4. Rules systems
- Magic or advanced tech rules
- Costs, limits, and failure modes
- Rare exceptions

5. Setting map
- Primary locations
- Travel constraints
- Strategic hotspots

6. Cultural fabric
- Beliefs, rituals, taboos
- Economy, class, labor
- Law, justice, punishment

7. History and pressure
- Timeline anchors
- Open conflicts
- Recent events that changed the status quo

8. Language and flavor
- Naming conventions
- Dialects or registers
- Symbolic motifs and recurring imagery

9. Narrative readiness
- Must-have world elements for chapter one
- Elements to reveal slowly
- Elements intentionally left unknown

10. Literary style calibration
- Desired reader experience (for example: intimate, austere, lush, ironic, propulsive)
- Voice and diction targets
- Sentence architecture preferences
- Dialogue-to-description balance
- Figurative language density and motif handling
- Prohibited style habits and cliches
- Optional sample passages and what to emulate or avoid

11. Novelty boundaries and anti-rehash targets
- Tropes to avoid or aggressively subvert
- Familiar genre moves that should be refreshed
- Types of surprise the user wants (plot, emotional, structural, stylistic)
- Repetition patterns the user dislikes
- Acceptable intentional echoes and when to use them

12. Canon certainty and sourcing
- Which existing notes are most trustworthy
- Which areas are intentionally unknown
- Which assumptions are allowed temporarily
- What must be confirmed before chapter drafting begins

13. Knowledge and inventory baselines
- Which primary characters start with which critical knowledge
- Which secondary characters know restricted information
- Starting inventory for key characters (items, tools, documents, resources)
- Ownership and access constraints for high-impact items

## Completion Criteria

Conclude interview only after each topic has either:
- a concrete answer, or
- an explicit intentional-unknown marker.

Before concluding, run a final relevance pass:
- remove any unresolved question that is not directly useful for the next chapter decisions
- rewrite vague questions into text-anchored questions with explicit scope

Before concluding, run a final fabrication pass:
- list all inferred facts requiring confirmation
- ask for explicit lock/confirm decisions on high-impact inferred facts
- keep unresolved high-impact items marked unknown in world docs
- update `world_fact_registry.md` using the fact registry template
- initialize or update `knowledge_map.md` with baseline secret distribution and starting inventory states

Then generate or update world files with the world doc generator prompt.
