from __future__ import annotations

import uuid
from typing import Any, List

from pydantic import EmailStr
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlmodel import Field, Relationship, SQLModel


def default_lesson_content() -> dict[str, str]:
    return {
        "definition": "",
        "keyComponentsAndTerms": "",
        "crossTopics": "",
        "outcomesProsCons": "",
        "scenariosApplications": "",
        "exercises": "",
        "nextLessonTeaser": "",
    }


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    role: str = Field(default="CREATOR", max_length=50) # CREATOR, STUDENT, ADMIN


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class QuizQuestion(SQLModel):
    questionText: str
    options: list[str] = Field(min_length=2)
    correctAnswer: str
    explanation: str


class LessonBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str | None = Field(default=None, max_length=512)
    order: int = Field(default=1, ge=1)
    status: str = Field(default="NOT_STARTED", max_length=32)


class LessonWrite(LessonBase):
    id: uuid.UUID | None = None
    content: dict[str, Any] | None = None
    quiz: list[QuizQuestion] | None = None


class LessonUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    summary: str | None = Field(default=None, max_length=512)
    order: int | None = Field(default=None, ge=1)
    status: str | None = Field(default=None, max_length=32)
    content: dict[str, Any] | None = None
    quiz: list[QuizQuestion] | None = None


class Lesson(LessonBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    module_id: uuid.UUID = Field(
        foreign_key="module.id", nullable=False, ondelete="CASCADE"
    )
    content: dict[str, Any] = Field(
        default_factory=default_lesson_content, sa_column=Column(JSONB)
    )
    quiz: list[dict[str, Any]] = Field(
        default_factory=list, sa_column=Column(JSONB)
    )
    module: "Module" = Relationship(
        sa_relationship=relationship("Module", back_populates="lessons")
    )


class LessonPublic(LessonBase):
    id: uuid.UUID
    module_id: uuid.UUID
    content: dict[str, Any]
    quiz: list[QuizQuestion]


class ModuleBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=512)
    order: int = Field(default=1, ge=1)
    outline_confirmed: bool = False


class ModuleWrite(ModuleBase):
    id: uuid.UUID | None = None
    lessons: list[LessonWrite] = Field(default_factory=list)


class ModuleUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=512)
    order: int | None = Field(default=None, ge=1)
    outline_confirmed: bool | None = None


class Module(ModuleBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_id: uuid.UUID = Field(
        foreign_key="course.id", nullable=False, ondelete="CASCADE"
    )
    course: "Course" = Relationship(
        sa_relationship=relationship("Course", back_populates="modules")
    )
    lessons: List["Lesson"] = Relationship(
        sa_relationship=relationship("Lesson", back_populates="module", cascade="all, delete-orphan")
    )


class ModulePublic(ModuleBase):
    id: uuid.UUID
    course_id: uuid.UUID
    lessons: list[LessonPublic] = Field(default_factory=list)


class CourseBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    short_description: str | None = Field(default=None, max_length=512)
    target_audience: str | None = Field(default=None, max_length=255)
    level: str | None = Field(default=None, max_length=50)
    content_style: str | None = Field(default=None, max_length=255)
    status: str = Field(default="IN_PROGRESS", max_length=32)
    learning_objectives: list[str] = Field(
        default_factory=list, sa_column=Column(JSONB)
    )


class CourseCreate(CourseBase):
    modules: list[ModuleWrite] = Field(default_factory=list)


class CourseOutlineUpdate(SQLModel):
    learning_objectives: list[str]
    modules: list[ModuleWrite] = Field(default_factory=list)


class CourseUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    short_description: str | None = Field(default=None, max_length=512)
    target_audience: str | None = Field(default=None, max_length=255)
    level: str | None = Field(default=None, max_length=50)
    content_style: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=32)
    learning_objectives: list[str] | None = None


class Course(CourseBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID | None = Field(
        default=None, foreign_key="user.id", ondelete="SET NULL"
    )
    owner: "User" = Relationship(
        sa_relationship=relationship("User", back_populates="courses")
    )
    modules: List["Module"] = Relationship(
        sa_relationship=relationship("Module", back_populates="course", cascade="all, delete-orphan")
    )


class CoursePublic(CourseBase):
    id: uuid.UUID
    owner_id: uuid.UUID | None = None
    modules: list[ModulePublic] = Field(default_factory=list)


class CoursesPublic(SQLModel):
    data: list[CoursePublic]
    count: int


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    courses: List["Course"] = Relationship(
        sa_relationship=relationship("Course", back_populates="owner", cascade="all, delete-orphan")
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
