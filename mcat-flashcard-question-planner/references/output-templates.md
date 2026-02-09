# Output Templates for ENT Practice App

Use these shapes when returning structured content.

## Flashcard batch

```json
{
  "deck_id": "mcat-cp-week-01",
  "title": "MCAT CP Week 1",
  "source": "generated-by-mcat-flashcard-question-planner",
  "cards": [
    {
      "id": "cp-card-0001",
      "section": "CP",
      "topic": "Acid-Base Chemistry",
      "difficulty": "foundational",
      "front": "Define pKa in one sentence.",
      "back": "pKa is the negative log of the acid dissociation constant and reflects acid strength.",
      "hint": "Lower pKa means stronger acid",
      "tags": ["mcat", "cp", "acid-base"]
    }
  ]
}
```

## MCQ batch

```json
{
  "set_id": "mcat-bb-set-02",
  "title": "MCAT BB Mixed Practice",
  "source": "generated-by-mcat-flashcard-question-planner",
  "questions": [
    {
      "id": "bb-q-0007",
      "section": "BB",
      "topic": "Enzyme Kinetics",
      "difficulty": "medium",
      "estimated_seconds": 90,
      "stem": "An inhibitor raises Km while Vmax is unchanged. Which model best fits?",
      "choices": {
        "A": "Competitive inhibition",
        "B": "Noncompetitive inhibition",
        "C": "Uncompetitive inhibition",
        "D": "Irreversible inhibition"
      },
      "correct_choice": "A",
      "explanation": "Competitive inhibitors increase apparent Km without reducing Vmax.",
      "distractor_rationales": {
        "B": "Noncompetitive inhibition lowers Vmax.",
        "C": "Uncompetitive inhibition lowers both Km and Vmax.",
        "D": "Irreversible inhibition reduces active enzyme availability."
      },
      "tags": ["mcat", "bb", "enzymes"]
    }
  ]
}
```

## Weekly plan

```json
{
  "plan_id": "mcat-6week-plan-v1",
  "title": "MCAT Six Week Plan",
  "source": "generated-by-mcat-flashcard-question-planner",
  "weeks": [
    {
      "week": 1,
      "focus_sections": ["CP", "CARS"],
      "new_cards_target": 120,
      "question_target": 45,
      "passage_target": 4,
      "review_schedule_days": [1, 3, 7],
      "notes": "Emphasize baseline diagnostics and weak-topic tagging."
    }
  ]
}
```
