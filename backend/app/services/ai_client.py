import json
import logging
from typing import Any

from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

async def generate_ai_response(
    system_prompt: str, user_content: str, temperature: float = 0.7
) -> str:
    """
    Generate a response from the AI provider.
    Fallback to enhanced mock if no API key is set.
    """
    if not settings.AI_API_KEY:
        return _mock_generate_response(system_prompt, user_content)

    try:
        client = AsyncOpenAI(api_key=settings.AI_API_KEY)
        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"AI Generation failed: {e}")
        # Fallback on error to keep app usable
        return f"[Error: {e}] Falling back to mock: " + _mock_generate_response(system_prompt, user_content)


async def build_structured_stub(payload: dict[str, Any]) -> dict[str, Any]:
    """
    If the AI call is structured (e.g. JSON output), this helper builds it.
    Real implementation would use JSON mode with the LLM. 
    For now, we simulate structured data for the mock, 
    but for the 'Real' mode we'll just rely on the LLM returning JSON if prompted correctly.
    
    HOWEVER, the current architecture separates 'stub' structure from 'text' generation.
    To avoid massive refactoring, we'll keep this structure-builder for the MOCK mode,
    and if we truly want real content, we should integrate it here.
    
    For this 'Base Version', we will keep the hybrid approach:
    - Real AI generates the 'text' fields (drafts, summaries).
    - Structure (lists of lessons, quiz options) is still mocked UNLESS we ask AI for JSON.
    """
    
    # Check if we should try real AI for structure
    # For simplicity in this base version, we will enhance the mock logic to be dynamic
    # based on the input title, so it doesn't look static.
    
    title = payload.get("title") or payload.get("course_title") or "Generic Course"
    module_title = payload.get("module_title") or payload.get("module", {}).get("title")
    lesson_title = payload.get("lesson_title") or payload.get("lesson", {}).get("title")

    return _generate_dynamic_mock_structure(title, module_title, lesson_title)


def _mock_generate_response(system_prompt: str, user_content: str) -> str:
    """Enhanced mock text generation."""
    topic = user_content.splitlines()[0] if user_content else "general topic"
    
    if "course" in system_prompt.lower():
        return (
            f"## Course Strategy: {topic}\n\n"
            f"This course will guide learners through the essentials of {topic}. "
            "We will start with core principles, move to advanced techniques, "
            "and finish with real-world projects.\n\n"
            "- **Phase 1**: Discovery\n"
            "- **Phase 2**: Application\n"
            "- **Phase 3**: Mastery"
        )
    elif "teacher" in system_prompt.lower() or "lesson" in system_prompt.lower():
        return (
            f"### Introduction to {topic}\n\n"
            f"Welcome to this lesson on **{topic}**. In this session, we explore why this concept matters. "
            "Imagine a world without it—things would be much harder! \n\n"
            "#### Key Takeaway\n"
            f"The most important thing to remember about {topic} is that it bridges theory and practice."
        )
    
    return f"[Mock AI] Interesting point about {topic}. Tell me more."


def _generate_dynamic_mock_structure(course_title: str, module_title: str | None, lesson_title: str | None) -> dict[str, Any]:
    """Generates consistent but dynamic structure based on input strings."""
    
    # deterministic pseudo-random based on string hash
    seed = sum(ord(c) for c in (course_title + (module_title or "") + (lesson_title or "")))
    
    topics = ["Fundamentals", "Advanced Concepts", "Case Studies", "Best Practices", "Future Trends"]
    verbs = ["Analyze", "Build", "Create", "Deploy", "Evaluate"]
    
    # Course Outline
    objectives = [
        f"Master the basics of {course_title}",
        f"Apply {course_title} in professional settings",
        f"Evaluate different approaches to {course_title}"
    ]
    
    modules = [
        {
            "title": f"Intro to {course_title}",
            "description": "Setting the stage and defining terms."
        },
        {
            "title": f"{course_title} in Practice",
            "description": "Hands-on examples and workflows."
        },
        {
            "title": "Advanced Mastery",
            "description": "Deep dive into complex edge cases."
        }
    ]
    
    # Module Lessons
    lessons = []
    if module_title:
        lessons = [
            {"title": f"What is {module_title}?", "summary": "Core definition."},
            {"title": f"Why {module_title} Matters", "summary": "Business value and impact."},
            {"title": f"Implementing {module_title}", "summary": "Step-by-step guide."},
            {"title": f"Common Pitfalls in {module_title}", "summary": "What to avoid."}
        ]

    # Lesson Content
    content = {}
    if lesson_title:
        content = {
            "definition": f"{lesson_title} is a critical component of {course_title}.",
            "keyComponentsAndTerms": f"- Term A: related to {lesson_title}\n- Term B: important for {module_title}",
            "crossTopics": f"This relates to {topics[seed % len(topics)]}.",
            "outcomesProsCons": "Pros: Efficiency, Scale. Cons: Complexity.",
            "scenariosApplications": "Use this when designing scalable systems.",
            "exercises": "1. Analyze a case study.\n2. Write a reflection.",
            "nextLessonTeaser": "Next, we will look at how to optimize this further.",
        }

    # Quiz
    quiz = []
    if lesson_title:
        quiz = [
            {
                "questionText": f"What is the primary benefit of {lesson_title}?",
                "options": ["Efficiency", "Confusion", "Slower performance", "None of the above"],
                "correctAnswer": "Efficiency",
                "explanation": "It helps streamline processes."
            },
            {
                "questionText": f"Who should use {lesson_title}?",
                "options": ["Everyone", "Only experts", "Beginners only", "Nobody"],
                "correctAnswer": "Everyone",
                "explanation": "It is applicable across all levels."
            }
        ]

    return {
        "objectives": objectives,
        "modules": modules,
        "lessons": lessons,
        "content": content,
        "quiz": quiz
    }
