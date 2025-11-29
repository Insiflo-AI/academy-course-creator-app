from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai_client import build_structured_stub, generate_ai_response

router = APIRouter(prefix="/ai", tags=["ai"])


class CourseOutlineRequest(BaseModel):
    title: str
    shortDescription: str | None = None
    targetAudience: str | None = None
    level: str | None = None
    contentStyle: str | None = None


class ModuleLessonsRequest(BaseModel):
    course_title: str
    learning_objectives: list[str] = Field(default_factory=list)
    level: str | None = None
    targetAudience: str | None = None
    contentStyle: str | None = None
    module_title: str
    module_description: str | None = None


class LessonContentRequest(BaseModel):
    course_title: str
    level: str | None = None
    targetAudience: str | None = None
    contentStyle: str | None = None
    module_title: str
    lesson_title: str
    previous_lesson: str | None = None
    next_lesson: str | None = None


class LessonQuizRequest(BaseModel):
    lesson_title: str
    lesson_content: dict[str, Any] = Field(default_factory=dict)
    num_questions: int | None = 4


@router.post("/course-outline")
async def generate_course_outline(payload: CourseOutlineRequest) -> dict[str, Any]:
    stub = await build_structured_stub(payload.model_dump())
    ai_text = await generate_ai_response(
        "You are an expert curriculum designer.", payload.title
    )
    return {"learningObjectives": stub["objectives"], "modules": stub["modules"], "draft": ai_text}


@router.post("/module-lessons")
async def suggest_module_lessons(payload: ModuleLessonsRequest) -> dict[str, Any]:
    stub = await build_structured_stub({
        "title": payload.course_title,
        "module_title": payload.module_title,
    })
    await generate_ai_response(
        "You are an expert curriculum designer.", payload.module_title
    )
    return {"lessons": stub["lessons"]}


@router.post("/lesson-content")
async def draft_lesson_content(payload: LessonContentRequest) -> dict[str, Any]:
    stub = await build_structured_stub({"lesson_title": payload.lesson_title})
    await generate_ai_response(
        "You are an expert teacher.", payload.lesson_title
    )
    return stub["content"]


@router.post("/lesson-quiz")
async def draft_lesson_quiz(payload: LessonQuizRequest) -> dict[str, Any]:
    stub = await build_structured_stub({"lesson_title": payload.lesson_title})
    await generate_ai_response(
        "You are an assessment designer.", payload.lesson_title
    )
    questions = stub["quiz"][: payload.num_questions or 4]
    return {"questions": questions}
