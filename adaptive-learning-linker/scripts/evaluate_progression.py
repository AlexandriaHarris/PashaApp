#!/usr/bin/env python3
"""Evaluate unlock and recommendation actions from learner progress data."""

import argparse
import json
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, Iterable, List, Set, Tuple


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def to_bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    return default


def to_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def to_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_time(value: str) -> Tuple[int, datetime]:
    try:
        normalized = value.replace("Z", "+00:00")
        return (0, datetime.fromisoformat(normalized))
    except Exception:
        return (1, datetime.min)


def sorted_attempts(attempts: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    indexed = list(enumerate(attempts))

    def key(item: Tuple[int, Dict[str, Any]]) -> Tuple[int, datetime, int]:
        idx, attempt = item
        stamp = attempt.get("answered_at")
        if isinstance(stamp, str) and stamp:
            penalty, parsed = parse_time(stamp)
            return (penalty, parsed, idx)
        return (2, datetime.min, idx)

    return [item[1] for item in sorted(indexed, key=key)]


def build_action(action: str, content_type: str, content_id: str, reason: str) -> Dict[str, str]:
    return {
        "action": action,
        "content_type": content_type,
        "content_id": content_id,
        "reason": reason,
    }


def evaluate(snapshot: Dict[str, Any], content_map: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    cfg = {
        "missed_question_unlocks_flashcards": to_bool(config.get("missed_question_unlocks_flashcards"), True),
        "reading_completion_unlocks_flashcards": to_bool(config.get("reading_completion_unlocks_flashcards"), True),
        "reading_completion_unlocks_questions": to_bool(config.get("reading_completion_unlocks_questions"), True),
        "struggle_min_attempts": to_int(config.get("struggle_min_attempts"), 5),
        "struggle_max_accuracy": to_float(config.get("struggle_max_accuracy"), 0.60),
        "struggle_incorrect_streak": to_int(config.get("struggle_incorrect_streak"), 3),
        "analysis_window": to_int(config.get("analysis_window"), 20),
        "allow_repeat_recommendation": to_bool(config.get("allow_repeat_recommendation"), False),
    }

    question_type_map = content_map.get("question_type_map", {})
    reading_map = content_map.get("reading_map", {})

    unlocked_flashcards: Set[str] = set(snapshot.get("unlocked", {}).get("flashcards", []))
    unlocked_questions: Set[str] = set(snapshot.get("unlocked", {}).get("questions", []))
    completed_readings: Set[str] = set(snapshot.get("completed_readings", []))
    attempts = sorted_attempts(snapshot.get("question_attempts", []))

    actions: List[Dict[str, str]] = []
    seen: Set[Tuple[str, str, str]] = set()

    def add(action: str, content_type: str, content_id: str, reason: str) -> None:
        key = (action, content_type, content_id)
        if not content_id or key in seen:
            return
        seen.add(key)
        actions.append(build_action(action, content_type, content_id, reason))

    if cfg["missed_question_unlocks_flashcards"]:
        for attempt in attempts:
            if attempt.get("correct") is not False:
                continue
            q_type = attempt.get("question_type")
            if q_type not in question_type_map:
                continue
            for card_id in question_type_map[q_type].get("flashcards", []):
                if card_id not in unlocked_flashcards:
                    add("unlock", "flashcard", card_id, f"Missed question in type: {q_type}")
                    unlocked_flashcards.add(card_id)

    for reading_id in completed_readings:
        links = reading_map.get(reading_id, {})
        if cfg["reading_completion_unlocks_flashcards"]:
            for card_id in links.get("flashcards", []):
                if card_id not in unlocked_flashcards:
                    add("unlock", "flashcard", card_id, f"Completed reading: {reading_id}")
                    unlocked_flashcards.add(card_id)
        if cfg["reading_completion_unlocks_questions"]:
            for qset_id in links.get("questions", []):
                if qset_id not in unlocked_questions:
                    add("unlock", "question_set", qset_id, f"Completed reading: {reading_id}")
                    unlocked_questions.add(qset_id)

    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for attempt in attempts:
        q_type = attempt.get("question_type")
        if q_type:
            grouped[q_type].append(attempt)

    for q_type, group in grouped.items():
        recent = group[-cfg["analysis_window"] :]
        if len(recent) < cfg["struggle_min_attempts"]:
            continue
        correct_count = sum(1 for a in recent if a.get("correct") is True)
        accuracy = correct_count / len(recent)

        streak = 0
        for attempt in reversed(recent):
            if attempt.get("correct") is False:
                streak += 1
            else:
                break

        is_struggling = accuracy <= cfg["struggle_max_accuracy"] or streak >= cfg["struggle_incorrect_streak"]
        if not is_struggling:
            continue

        for reading_id in question_type_map.get(q_type, {}).get("readings", []):
            if not cfg["allow_repeat_recommendation"] and reading_id in completed_readings:
                continue
            reason = (
                f"Low recent accuracy in type: {q_type}"
                if accuracy <= cfg["struggle_max_accuracy"]
                else f"Incorrect streak in type: {q_type}"
            )
            add("recommend", "reading", reading_id, reason)

    return {
        "user_id": snapshot.get("user_id"),
        "actions": actions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate adaptive unlock and recommendation actions")
    parser.add_argument("--snapshot", required=True, help="Path to learner snapshot JSON")
    parser.add_argument("--map", required=True, dest="content_map", help="Path to content map JSON")
    parser.add_argument("--config", help="Optional rules config JSON")
    parser.add_argument("--out", help="Optional output JSON path")
    args = parser.parse_args()

    snapshot = load_json(args.snapshot)
    content_map = load_json(args.content_map)
    config = load_json(args.config) if args.config else {}

    result = evaluate(snapshot, content_map, config)
    payload = json.dumps(result, indent=2)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(payload + "\n")
    else:
        print(payload)


if __name__ == "__main__":
    main()
