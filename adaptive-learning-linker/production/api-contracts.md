# API Contracts

## 1) Ingest learner event

`POST /v1/learning/events`

Headers:
- `Idempotency-Key: <uuid>`

Body:
```json
{
  "user_id": "u_123",
  "event_type": "question_submitted",
  "occurred_at": "2026-02-09T18:30:00Z",
  "payload": {
    "question_id": "q_001",
    "question_type": "cell-biology",
    "correct": false
  }
}
```

Response:
```json
{
  "event_id": 9812,
  "status": "accepted"
}
```

## 2) Poll learner actions

`GET /v1/users/{user_id}/learning-actions?status=pending&limit=50`

Response:
```json
{
  "actions": [
    {
      "id": 5501,
      "action_type": "unlock",
      "content_type": "flashcard",
      "content_id": "fc_organelle_02",
      "reason": "Missed question in type: cell-biology",
      "created_at": "2026-02-09T18:30:01Z"
    }
  ]
}
```

## 3) Acknowledge action application

`POST /v1/learning-actions/{action_id}/ack`

Body:
```json
{
  "status": "applied",
  "metadata": {
    "surface": "study_home"
  }
}
```

Allowed statuses: `applied`, `dismissed`, `failed`.

## 4) Update progression rules (admin)

`PUT /v1/admin/progression-rules`

Body:
```json
{
  "struggle_min_attempts": 6,
  "struggle_max_accuracy": 0.55,
  "recommendation_cooldown_hours": 96
}
```

Notes:
- Validate rule types and bounds server-side.
- Track `rule_version` in logs and action metadata.
