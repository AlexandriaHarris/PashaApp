# Output Contract

Return actions in this shape:

```json
{
  "user_id": "u_123",
  "actions": [
    {
      "action": "unlock",
      "content_type": "flashcard",
      "content_id": "fc_organelle_02",
      "reason": "Missed question in type: cell-biology"
    },
    {
      "action": "recommend",
      "content_type": "reading",
      "content_id": "r_cells_intro",
      "reason": "Low recent accuracy in type: cell-biology"
    }
  ]
}
```

Rules:
- `action` is one of `unlock` or `recommend`.
- `content_type` is one of `flashcard`, `question_set`, or `reading`.
- Keep `reason` user-safe and concise.
- Do not duplicate identical actions.
