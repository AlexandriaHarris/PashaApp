# Production Architecture: Adaptive Unlock and Recommendation Engine

## Goal

Turn learner behavior into deterministic actions:
- Missed question -> unlock flashcards linked to that question type.
- Completed reading -> unlock linked flashcards and question sets.
- Consistent struggle by question type -> recommend mapped readings.

## Event-Driven Flow

1. App emits event (`question_submitted`, `reading_completed`) with idempotency key.
2. Backend writes event to `learning_events`.
3. Evaluator service processes event and reads:
- `content_links`
- `progression_rules`
- `user_content_state`
- `user_question_type_stats`
4. Evaluator writes actions to `action_queue` (deduped).
5. Consumer applies actions:
- `unlock` updates `user_content_state`
- `recommend` surfaces in learner inbox/feed
6. Consumer marks queue status (`applied`, `dismissed`, or `failed`).

## Evaluator Logic (Authoritative)

For `question_submitted`:
- Update `user_question_type_stats` window and streak.
- If incorrect and `missed_question_unlocks_flashcards` is true:
  - Find `content_links` where:
    - `source_type='question_type'`
    - `source_id=<question_type>`
    - `relation='unlock_on_miss'`
    - `target_type='flashcard'`
  - Queue `unlock` for locked targets.
- Evaluate struggle thresholds:
  - `attempts_window >= struggle_min_attempts`
  - `correct_window / attempts_window <= struggle_max_accuracy`
  - OR `incorrect_streak >= struggle_incorrect_streak`
- If struggling:
  - Find `recommend_on_struggle` reading links.
  - Apply cooldown (`recommendation_cooldown_hours`) and repeat policy.
  - Queue `recommend` actions.

For `reading_completed`:
- Mark reading `completed` in `user_content_state`.
- If `reading_completion_unlocks_flashcards` is true:
  - queue `unlock` from `relation='unlock_on_complete'` + `target_type='flashcard'`.
- If `reading_completion_unlocks_questions` is true:
  - queue `unlock` from `relation='unlock_on_complete'` + `target_type='question_set'`.

## Guards

- Idempotency on event write (`learning_events.idempotency_key`).
- De-dupe on queued actions (`ux_action_queue_dedupe`).
- Rate limits:
  - `max_unlocks_per_event`
  - `max_recommendations_per_day`
- Safety:
  - Never relock content.
  - Never recommend completed readings unless explicitly enabled.
  - Keep queue processing retry-safe.

## Operational SLOs

- P95 evaluation latency < 200ms per event.
- Queue consumer delay < 2s.
- Failed action rate < 0.5% daily.

## Observability

Emit metrics:
- `events_ingested_total` by `event_type`
- `actions_queued_total` by `action_type`, `content_type`
- `actions_applied_total` by status
- `recommendations_suppressed_total` by reason (`cooldown`, `already_completed`, `dedupe`, `daily_cap`)
- `evaluator_duration_ms`

Use structured logs with `user_id`, `event_id`, `question_type`, and `rule_version`.
