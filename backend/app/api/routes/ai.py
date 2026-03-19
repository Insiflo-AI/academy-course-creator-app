import json
import logging
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models import (
    Course,
    CourseCreate,
    CourseUpdate,
    CoursePublic,
    Module,
    ModuleWrite,
    Lesson,
    LessonWrite,
    LessonPublic,
    User,
    QuizQuestion,
)
from app.services.ai_client import generate_ai_response

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Helper Functions ---

async def _parse_json_response(response_text: str) -> dict[str, Any] | list[Any]:
    """Attempts to parse JSON from AI response, handling potential markdown fences."""
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse JSON from AI: {response_text}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed JSON. Please try again or refine parameters.",
        )

# --- Endpoints ---

@router.post("/course-outline", response_model=dict[str, Any])
async def generate_course_outline(
    data: dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Step 0/1: Generate Course Outline (Objectives + Modules).
    Input: { "title": str, "targetAudience": str, ... }
    """
    title = data.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    system_prompt = (
        "You are an expert curriculum designer. Given only the course title and optional metadata, "
        "return a JSON object with: 'learningObjectives' (array of strings) and "
        "'modules' (array of objects with 'title' and 'description'). "
        "Appropriate for the given level. Do NOT generate lessons."
    )
    
    user_content = f"Title: {title}\n"
    if data.get("targetAudience"):
        user_content += f"Audience: {data['targetAudience']}\n"
    if data.get("level"):
        user_content += f"Level: {data['level']}\n"
    if data.get("contentStyle"):
        user_content += f"Style: {data['contentStyle']}\n"
    if data.get("shortDescription"):
        user_content += f"Description: {data['shortDescription']}\n"

    response_text = await generate_ai_response(system_prompt, user_content, temperature=0.7)
    parsed = await _parse_json_response(response_text)
    
    # Fallback/Validation if mock returns structured data directly or AI returns specific keys
    if "objectives" in parsed and "modules" in parsed:
         # Map 'objectives' -> 'learningObjectives' if needed, or trust prompt
         return {"learningObjectives": parsed["objectives"], "modules": parsed["modules"]}
         
    return parsed


@router.post("/module-lessons", response_model=dict[str, Any])
async def generate_module_lessons(
    data: dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Step 2: Suggest Lessons for a Module.
    Input: { "courseTitle": str, "moduleTitle": str, "moduleDescription": str, ... }
    """
    course_title = data.get("courseTitle") or data.get("course_title") or "Unknown Course"
    module_title = data.get("moduleTitle") or data.get("module_title") or "Unknown Module"
    
    system_prompt = (
        "You are an expert curriculum designer. Suggest an ordered list of lesson titles "
        "(with 1-2 line summaries) that fully cover this module. "
        "Return a simple JSON object: { 'lessons': [ { 'title': '...', 'summary': '...' } ] }. "
        "Do NOT generate lesson content."
    )
    
    user_content = (
        f"Course: {course_title}\n"
        f"Module: {module_title}\n"
        f"Module Description: {data.get('moduleDescription', '')}\n"
    )
    
    response_text = await generate_ai_response(system_prompt, user_content, temperature=0.7)
    return await _parse_json_response(response_text)


@router.post("/lesson-content", response_model=dict[str, Any])
async def generate_lesson_content(
    data: dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Step 3: Draft Lesson Content.
    Input: { "courseTitle": str, "moduleTitle": str, "lessonTitle": str, ... }
    """
    lesson_title = data.get("lessonTitle") or data.get("lesson_title") or ""
    course_title = data.get("courseTitle") or data.get("course_title")
    module_title = data.get("moduleTitle") or data.get("module_title")
    
    system_prompt = (
        "You are an expert teacher. Generate structured content ONLY for this single lesson. "
        "Return JSON with fields: definition, keyComponentsAndTerms, crossTopics, "
        "outcomesProsCons, scenariosApplications, exercises, nextLessonTeaser. "
        "Do NOT produce any other sections. Make content appropriate to the level."
    )
    
    user_content = (
        f"Course: {course_title}\n"
        f"Module: {module_title}\n"
        f"Lesson: {lesson_title}\n"
    )

    response_text = await generate_ai_response(system_prompt, user_content, temperature=0.7)
    return await _parse_json_response(response_text)


@router.post("/lesson-quiz", response_model=dict[str, Any])
async def generate_lesson_quiz(
    data: dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Step 4: Generate Quiz.
    Input: { "lessonContent": ... } or { "lessonTitle": ... }
    """
    system_prompt = (
        "You are an assessment designer. Create multiple-choice questions that test understanding of this lesson. "
        "For each question, output: questionText, 4 options (array of strings), correctAnswer (string), and explanation. "
        "Return JSON: { 'questions': [ ... ] }"
    )
    
    user_content = f"Lesson Context:\n{json.dumps(data, default=str)}"
    
    response_text = await generate_ai_response(system_prompt, user_content, temperature=0.7)
    return await _parse_json_response(response_text)
