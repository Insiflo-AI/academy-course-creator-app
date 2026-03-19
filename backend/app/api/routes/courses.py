from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import SQLModel, Session, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Course,
    CourseCreate,
    CourseOutlineUpdate,
    CoursePublic,
    CourseUpdate,
    CoursesPublic,
    Lesson,
    LessonPublic,
    LessonUpdate,
    LessonWrite,
    Message,
    Module,
    ModulePublic,
    ModuleWrite,
    QuizQuestion,
    default_lesson_content,
)

router = APIRouter(tags=["courses"])


def _course_with_children() -> Any:
    return select(Course).options(
        selectinload(Course.modules).selectinload(Module.lessons)
    )


def _load_course(session: Session, course_id: uuid.UUID) -> Course:
    course = session.exec(
        _course_with_children().where(Course.id == course_id)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _ensure_course_access(course: Course, user: CurrentUser) -> None:
    if not user.is_superuser and course.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def _normalize_quiz(
    quiz: list[QuizQuestion] | list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    if quiz is None:
        return []
    return [
        q.model_dump() if isinstance(q, QuizQuestion) else q  # type: ignore[arg-type]
        for q in quiz
    ]


def _upsert_lessons(
    session: Session, module: Module, lessons_in: list[LessonWrite] | None
) -> list[Lesson]:
    existing = {lesson.id: lesson for lesson in module.lessons or []}
    retained_ids: set[uuid.UUID] = set()
    ordered_lessons: list[Lesson] = []

    for idx, lesson_in in enumerate(lessons_in or [], start=1):
        lesson_data = lesson_in.model_dump(
            exclude={"id", "content", "quiz"}, exclude_none=True
        )
        lesson_data["order"] = lesson_in.order or idx
        lesson_data.setdefault("status", "NOT_STARTED")

        lesson: Lesson
        if lesson_in.id and lesson_in.id in existing:
            lesson = existing[lesson_in.id]
            lesson.sqlmodel_update(lesson_data)
        else:
            lesson = Lesson.model_validate(
                lesson_data,
                update={
                    "module_id": module.id,
                    "content": lesson_in.content or default_lesson_content(),
                    "quiz": _normalize_quiz(lesson_in.quiz),
                },
            )

        if lesson_in.content is not None:
            lesson.content = {**lesson.content, **lesson_in.content}
        if lesson_in.quiz is not None:
            lesson.quiz = _normalize_quiz(lesson_in.quiz)

        session.add(lesson)
        session.flush()
        retained_ids.add(lesson.id)
        ordered_lessons.append(lesson)

    for lesson in module.lessons or []:
        if lesson.id not in retained_ids:
            session.delete(lesson)

    module.lessons = ordered_lessons
    return ordered_lessons


def _upsert_modules(
    session: Session, course: Course, modules_in: list[ModuleWrite]
) -> list[Module]:
    existing = {module.id: module for module in course.modules or []}
    retained_ids: set[uuid.UUID] = set()
    ordered_modules: list[Module] = []

    for idx, module_in in enumerate(modules_in, start=1):
        module_data = module_in.model_dump(
            exclude={"id", "lessons"}, exclude_none=True
        )
        module_data["order"] = module_in.order or idx
        module_data.setdefault("outline_confirmed", True)

        module: Module
        if module_in.id and module_in.id in existing:
            module = existing[module_in.id]
            module.sqlmodel_update(module_data)
        else:
            module = Module.model_validate(
                module_data,
                update={"course_id": course.id},
            )

        session.add(module)
        session.flush()
        retained_ids.add(module.id)
        if module_in.lessons:
            _upsert_lessons(session, module, module_in.lessons)
        ordered_modules.append(module)

    for module in course.modules or []:
        if module.id not in retained_ids:
            session.delete(module)

    course.modules = ordered_modules
    return ordered_modules


@router.get("/", response_model=CoursesPublic)
def list_courses(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    base_query = _course_with_children()

    if current_user.is_superuser:
        count_stmt = select(func.count()).select_from(Course)
        courses_stmt = base_query.offset(skip).limit(limit)
    else:
        count_stmt = (
            select(func.count())
            .select_from(Course)
            .where(Course.owner_id == current_user.id)
        )
        courses_stmt = (
            base_query.where(Course.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )

    count = session.exec(count_stmt).one()
    courses = session.exec(courses_stmt).all()
    return CoursesPublic(data=courses, count=count)


@router.post("/", response_model=CoursePublic, status_code=status.HTTP_201_CREATED)
def create_course(
    *, session: SessionDep, current_user: CurrentUser, course_in: CourseCreate
) -> CoursePublic:
    course_data = course_in.model_dump(exclude={"modules"})
    course = Course.model_validate(course_data, update={"owner_id": current_user.id})
    session.add(course)
    session.flush()

    if course_in.modules:
        _upsert_modules(session, course, course_in.modules)

    session.commit()
    return _load_course(session, course.id)


@router.get("/{course_id}", response_model=CoursePublic)
def get_course(
    course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> CoursePublic:
    course = _load_course(session, course_id)
    _ensure_course_access(course, current_user)
    return course


@router.patch("/{course_id}", response_model=CoursePublic)
def update_course(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    course_id: uuid.UUID,
    course_in: CourseUpdate,
) -> CoursePublic:
    course = _load_course(session, course_id)
    _ensure_course_access(course, current_user)

    update_data = course_in.model_dump(exclude_unset=True)
    if update_data:
        course.sqlmodel_update(update_data)
        session.add(course)
        session.commit()

    return _load_course(session, course_id)


@router.put("/{course_id}/outline", response_model=CoursePublic)
def update_course_outline(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    course_id: uuid.UUID,
    outline: CourseOutlineUpdate,
) -> CoursePublic:
    course = _load_course(session, course_id)
    _ensure_course_access(course, current_user)

    course.learning_objectives = outline.learning_objectives
    session.add(course)
    session.flush()

    _upsert_modules(session, course, outline.modules)
    session.commit()

    return _load_course(session, course_id)


@router.put(
    "/modules/{module_id}/lessons",
    response_model=ModulePublic,
    status_code=status.HTTP_200_OK,
)
def save_module_lessons(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    module_id: uuid.UUID,
    payload: ModuleLessonsPayload,
) -> ModulePublic:
    module = session.exec(
        select(Module)
        .where(Module.id == module_id)
        .options(selectinload(Module.course), selectinload(Module.lessons))
    ).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if not module.course:
        raise HTTPException(status_code=400, detail="Module missing course relation")

    _ensure_course_access(module.course, current_user)

    _upsert_lessons(session, module, payload.lessons)
    session.commit()
    session.refresh(module)
    return module


class LessonQuizUpdate(SQLModel):
    quiz: list[QuizQuestion]
    status: str | None = "CONFIRMED"


class ModuleLessonsPayload(SQLModel):
    lessons: list[LessonWrite]


@router.patch("/lessons/{lesson_id}", response_model=LessonPublic)
def update_lesson(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    lesson_id: uuid.UUID,
    lesson_in: LessonUpdate,
) -> LessonPublic:
    lesson = session.exec(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.module).selectinload(Module.course))
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not lesson.module or not lesson.module.course:
        raise HTTPException(status_code=400, detail="Lesson missing course relation")

    _ensure_course_access(lesson.module.course, current_user)

    update_data = lesson_in.model_dump(exclude_unset=True, exclude={"content", "quiz"})
    if update_data:
        lesson.sqlmodel_update(update_data)
    if lesson_in.content is not None:
        lesson.content = {**lesson.content, **lesson_in.content}
    if lesson_in.quiz is not None:
        lesson.quiz = _normalize_quiz(lesson_in.quiz)

    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson


@router.put("/lessons/{lesson_id}/quiz", response_model=LessonPublic)
def save_lesson_quiz(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    lesson_id: uuid.UUID,
    payload: LessonQuizUpdate,
) -> LessonPublic:
    lesson = session.exec(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.module).selectinload(Module.course))
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not lesson.module or not lesson.module.course:
        raise HTTPException(status_code=400, detail="Lesson missing course relation")

    _ensure_course_access(lesson.module.course, current_user)

    lesson.quiz = _normalize_quiz(payload.quiz)
    if payload.status:
        lesson.status = payload.status

    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson


@router.delete("/{course_id}", response_model=Message)
def delete_course(
    course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Message:
    course = _load_course(session, course_id)
    _ensure_course_access(course, current_user)
    session.delete(course)
    session.commit()
    return Message(message="Course deleted successfully")
