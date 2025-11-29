import os
from typing import Any


async def generate_ai_response(system_prompt: str, user_content: str) -> str:
    """Stub AI client that would normally call an external AI provider.

    The implementation keeps the signature minimal so it can be swapped with a real
    client easily. For local development we simply echo back a short summary to
    keep the API surface predictable.
    """

    _ = os.getenv("AI_API_KEY")
    return (
        f"[ai-draft] {system_prompt.splitlines()[0].strip()} -- "
        f"{user_content[:200]}" + ("..." if len(user_content) > 200 else "")
    )


async def build_structured_stub(payload: dict[str, Any]) -> dict[str, Any]:
    """Helper to return predictable structured content for the demo flows."""

    course_title = payload.get("title") or payload.get("course_title") or "Course"
    module_title = payload.get("module_title") or payload.get("module", {}).get("title")
    lesson_title = payload.get("lesson_title") or payload.get("lesson", {}).get("title")

    return {
        "objectives": [
            f"Clarify outcomes for {course_title}",
            f"Cover fundamentals of {module_title or course_title}",
            "Provide practical examples",
        ],
        "modules": [
            {
                "title": module_title or "Foundations",
                "description": "Lay the groundwork and shared vocabulary.",
            },
            {
                "title": "Applications",
                "description": "Apply the concepts with hands-on scenarios.",
            },
        ],
        "lessons": [
            {
                "title": lesson_title or "Lesson 1",
                "summary": "Introduce the central idea and where it is used.",
            },
            {
                "title": "Lesson 2",
                "summary": "Explore nuances and practice with learners.",
            },
        ],
        "content": {
            "definition": f"Definition for {lesson_title or 'this lesson'}.",
            "keyComponentsAndTerms": "Key terms, components, and quick references.",
            "crossTopics": "Related topics and interdisciplinary links.",
            "outcomesProsCons": "Expected outcomes, strengths, and trade-offs.",
            "scenariosApplications": "Scenarios where this lesson applies.",
            "exercises": "Exercise 1; Exercise 2; Exercise 3",
            "nextLessonTeaser": "Preview of what comes next to maintain momentum.",
        },
        "quiz": [
            {
                "questionText": f"What is the main focus of {lesson_title or 'this lesson'}?",
                "options": [
                    "Understanding the core idea",
                    "Memorizing trivia",
                    "Ignoring applications",
                    "Skipping practice",
                ],
                "correctAnswer": "Understanding the core idea",
                "explanation": "Learners should leave with clarity on the core idea.",
            },
            {
                "questionText": "How can learners apply the concept?",
                "options": [
                    "By using it in a real scenario",
                    "Only by reading",
                    "By avoiding practice",
                    "None of the above",
                ],
                "correctAnswer": "By using it in a real scenario",
                "explanation": "Application cements understanding.",
            },
        ],
    }
