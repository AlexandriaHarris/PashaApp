# Rollout Plan

## Phase 1: MVP (1-2 weeks)

1. Ship schema in `/production/schema.sql`.
2. Implement event ingestion endpoint with idempotency.
3. Implement evaluator for three rules only:
- miss -> flashcard unlock
- reading complete -> flashcard unlock
- reading complete -> question set unlock
4. Add action queue consumer and status ack endpoint.
5. Add dashboards for ingest, queue, and failures.

Exit criteria:
- Duplicate events do not create duplicate actions.
- Unlock actions apply within 2 seconds.

## Phase 2: Recommendations (1 week)

1. Implement `user_question_type_stats` updater.
2. Add struggle-based reading recommendation.
3. Add cooldown and daily cap suppression.
4. Add UX surface for recommendation reasons.

Exit criteria:
- Recommendation precision >= baseline target you define (for example 60% accepted/opened).

## Phase 3: Optimization (ongoing)

1. Add A/B test flags in `progression_rules`.
2. Tune thresholds per course or cohort.
3. Add model-assisted prioritization (optional) after deterministic filters.
4. Backfill historical event replay for improved cold start.

## Non-Negotiable Tests

- Event idempotency test.
- Queue dedupe test.
- Rule boundary tests (`min_attempts`, `max_accuracy`, streak).
- Cooldown suppression test.
- Consumer retry and dead-letter test.
