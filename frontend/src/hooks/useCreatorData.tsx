// @ts-nocheck
import { createContext, type PropsWithChildren, useContext, useMemo, useState } from "react"

import type {
  Course,
  CourseStatus,
  Lesson,
  LessonContent,
  LessonStatus,
  Module,
  QuizQuestion,
} from "@/types/course"

interface CreatorState {
  courses: Course[]
  createCourse: (course: Omit<Course, "id" | "modules" | "learningObjectives"> & {
    learningObjectives?: string[]
    modules?: { title: string; description: string }[]
  }) => Course
  updateCourse: (courseId: string, data: Partial<Course>) => void
  confirmOutline: (
    courseId: string,
    learningObjectives: string[],
    modules: { title: string; description: string }[],
  ) => void
  saveLessons: (
    moduleId: string,
    lessons: { title: string; summary?: string }[],
  ) => Lesson[]
  saveLessonContent: (lessonId: string, content: Partial<LessonContent>, status?: LessonStatus) => void
  saveQuiz: (lessonId: string, questions: QuizQuestion[]) => void
}

const CreatorDataContext = createContext<CreatorState | undefined>(undefined)

const defaultLessonContent: LessonContent = {
  definition: "",
  keyComponentsAndTerms: "",
  crossTopics: "",
  outcomesProsCons: "",
  scenariosApplications: "",
  exercises: "",
  nextLessonTeaser: "",
}

export function CreatorDataProvider({ children }: PropsWithChildren) {
  const [courses, setCourses] = useState<Course[]>(() => {
    const starterId = crypto.randomUUID()
    const moduleId = crypto.randomUUID()
    const lessonId = crypto.randomUUID()
    return [
      {
        id: starterId,
        title: "AI Teaching Foundations",
        shortDescription: "A quick-start course to demonstrate the SaaS flow.",
        learningObjectives: [
          "Guide educators through iterative course building",
          "Show how AI drafts outlines and lessons",
        ],
        status: "IN_PROGRESS",
        modules: [
          {
            id: moduleId,
            courseId: starterId,
            title: "Getting Started",
            description: "Plan the course skeleton with AI support.",
            order: 1,
            outlineConfirmed: true,
            lessons: [
              {
                id: lessonId,
                title: "Working with AI Drafts",
                summary: "Understand how to co-create with AI",
                order: 1,
                status: "DRAFT",
                content: defaultLessonContent,
                quiz: [],
              },
            ],
          },
        ],
      },
    ]
  })

  const createCourse: CreatorState["createCourse"] = (course) => {
    const newCourse: Course = {
      ...course,
      id: crypto.randomUUID(),
      status: (course.status || "IN_PROGRESS") as CourseStatus,
      learningObjectives: course.learningObjectives || [],
      modules: (course.modules || []).map((mod, index) => ({
        id: uuidv4(),
        courseId: "",
        title: mod.title,
        description: mod.description,
        order: index + 1,
        outlineConfirmed: false,
        lessons: [],
      })),
    }
    newCourse.modules = newCourse.modules.map((mod) => ({ ...mod, courseId: newCourse.id }))

    setCourses((prev) => [...prev, newCourse])
    return newCourse
  }

  const updateCourse = (courseId: string, data: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, ...data, id: c.id, modules: c.modules } : c)),
    )
  }

  const confirmOutline: CreatorState["confirmOutline"] = (
    courseId,
    learningObjectives,
    modules,
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c
        const updatedModules: Module[] = modules.map((mod, index) => ({
          id: c.modules[index]?.id || crypto.randomUUID(),
          courseId: c.id,
          title: mod.title,
          description: mod.description,
          order: index + 1,
          outlineConfirmed: true,
          lessons: c.modules[index]?.lessons || [],
        }))
        return { ...c, learningObjectives, modules: updatedModules, status: "IN_PROGRESS" }
      }),
    )
  }

  const saveLessons: CreatorState["saveLessons"] = (moduleId, lessons) => {
    let nextLessons: Lesson[] = []
    setCourses((prev) =>
      prev.map((course) => ({
        ...course,
        modules: course.modules.map((mod) => {
          if (mod.id !== moduleId) return mod
          const updatedLessons: Lesson[] = lessons.map((lesson, index) => ({
            id: mod.lessons[index]?.id || crypto.randomUUID(),
            title: lesson.title,
            summary: lesson.summary,
            order: index + 1,
            status: mod.lessons[index]?.status || "NOT_STARTED",
            content: mod.lessons[index]?.content || defaultLessonContent,
            quiz: mod.lessons[index]?.quiz || [],
          }))
          nextLessons = updatedLessons
          return { ...mod, lessons: updatedLessons }
        }),
      })),
    )
    return nextLessons
  }

  const saveLessonContent: CreatorState["saveLessonContent"] = (lessonId, content, status) => {
    setCourses((prev) =>
      prev.map((course) => ({
        ...course,
        modules: course.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((lesson) => {
            if (lesson.id !== lessonId) return lesson
            return {
              ...lesson,
              content: { ...lesson.content, ...content },
              status: status || lesson.status,
            }
          }),
        })),
      })),
    )
  }

  const saveQuiz: CreatorState["saveQuiz"] = (lessonId, questions) => {
    setCourses((prev) =>
      prev.map((course) => ({
        ...course,
        modules: course.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((lesson) =>
            lesson.id === lessonId ? { ...lesson, quiz: questions, status: "CONFIRMED" } : lesson,
          ),
        })),
      })),
    )
  }

  const value = useMemo(
    () => ({ courses, createCourse, updateCourse, confirmOutline, saveLessons, saveLessonContent, saveQuiz }),
    [courses],
  )

  return <CreatorDataContext.Provider value={value}>{children}</CreatorDataContext.Provider>
}

export function useCreatorData() {
  const ctx = useContext(CreatorDataContext)
  if (!ctx) throw new Error("useCreatorData must be used within CreatorDataProvider")
  return ctx
}
