# Event Model

Use this canonical structure before evaluating unlock logic.

## learner snapshot

```json
{
  "user_id": "u_123",
  "completed_readings": ["r_cells_intro"],
  "unlocked": {
    "flashcards": ["fc_membrane_01"],
    "questions": ["qset_cells_basics"]
  },
  "question_attempts": [
    {
      "question_id": "q_9",
      "question_type": "cell-biology",
      "correct": false,
      "answered_at": "2026-02-09T09:00:00Z"
    }
  ]
}
```

## content map

```json
{
  "question_type_map": {
    "cell-biology": {
      "flashcards": ["fc_membrane_01", "fc_organelle_02"],
      "readings": ["r_cells_intro"]
    }
  },
  "reading_map": {
    "r_cells_intro": {
      "flashcards": ["fc_membrane_01", "fc_organelle_02"],
      "questions": ["qset_cells_basics"]
    }
  }
}
```

## Notes

- If `answered_at` is missing, process attempts in source order.
- Store `question_type` as stable taxonomy keys, not display labels.
- Keep mapping IDs aligned with app content IDs.
