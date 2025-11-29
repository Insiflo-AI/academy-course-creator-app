import type {
  CourseOutlineResponse,
  LessonContentResponse,
  LessonQuizResponse,
  ModuleLessonResponse,
} from "@/types/course"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

async function postJSON<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export async function generateCourseOutline(payload: {
  title: string
  shortDescription?: string
  targetAudience?: string
  level?: string
  contentStyle?: string
}): Promise<CourseOutlineResponse> {
  return postJSON<CourseOutlineResponse>("/ai/course-outline", payload)
}

export async function generateModuleLessons(payload: {
  course_title: string
  learning_objectives: string[]
  level?: string
  targetAudience?: string
  contentStyle?: string
  module_title: string
  module_description?: string
}): Promise<ModuleLessonResponse> {
  return postJSON<ModuleLessonResponse>("/ai/module-lessons", payload)
}

export async function generateLessonContent(payload: {
  course_title: string
  level?: string
  targetAudience?: string
  contentStyle?: string
  module_title: string
  lesson_title: string
  previous_lesson?: string
  next_lesson?: string
}): Promise<LessonContentResponse> {
  return postJSON<LessonContentResponse>("/ai/lesson-content", payload)
}

export async function generateLessonQuiz(payload: {
  lesson_title: string
  lesson_content: Record<string, unknown>
  num_questions?: number
}): Promise<LessonQuizResponse> {
  return postJSON<LessonQuizResponse>("/ai/lesson-quiz", payload)
}
