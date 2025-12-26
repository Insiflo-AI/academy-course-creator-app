import { defaultLessonContent } from "@/lib/courseDefaults"
import type {
  Course,
  CourseStatus,
  Lesson,
  LessonContent,
  LessonStatus,
  Level,
  Module,
  QuizQuestion,
} from "@/types/course"

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1"

type ApiLesson = {
  id: string
  module_id: string
  title: string
  summary?: string | null
  order: number
  status: LessonStatus
  content?: LessonContent | null
  quiz?: QuizQuestion[] | null
}

type ApiModule = {
  id: string
  course_id: string
  title: string
  description?: string | null
  order: number
  outline_confirmed: boolean
  lessons?: ApiLesson[]
}

type ApiCourse = {
  id: string
  owner_id?: string | null
  title: string
  short_description?: string | null
  target_audience?: string | null
  level?: string | null
  content_style?: string | null
  status: CourseStatus
  learning_objectives?: string[]
  modules?: ApiModule[]
}

type CoursesResponse = {
  data: ApiCourse[]
  count: number
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token")
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
      throw new Error("Session expired. Please login again.")
    }
    const detail = await response.text()
    if (response.status === 404 && detail.includes("User not found")) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
      throw new Error("User account not found. Please login again.")
    }
    throw new Error(detail || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export async function updateCourseOutline(
  courseId: string,
  payload: { learningObjectives: string[]; modules: { title: string; description?: string }[] }
): Promise<Course> {
  const body = {
    learning_objectives: payload.learningObjectives,
    modules: payload.modules.map((m, index) => ({
      title: m.title,
      description: m.description,
      order: index + 1,
      outline_confirmed: true
    }))
  }

  const data = await request<ApiCourse>(`/courses/${courseId}/outline`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
  return mapCourse(data)
}

function mapLesson(apiLesson: ApiLesson): Lesson {
  return {
    id: apiLesson.id,
    title: apiLesson.title,
    summary: apiLesson.summary ?? "",
    order: apiLesson.order,
    status: apiLesson.status,
    content: apiLesson.content ?? { ...defaultLessonContent },
    quiz: apiLesson.quiz ?? [],
  }
}

function mapModule(apiModule: ApiModule): Module {
  return {
    id: apiModule.id,
    courseId: apiModule.course_id,
    title: apiModule.title,
    description: apiModule.description ?? "",
    order: apiModule.order,
    outlineConfirmed: apiModule.outline_confirmed,
    lessons: (apiModule.lessons || []).map(mapLesson),
  }
}

function mapCourse(apiCourse: ApiCourse): Course {
  return {
    id: apiCourse.id,
    ownerId: apiCourse.owner_id ?? undefined,
    title: apiCourse.title,
    shortDescription: apiCourse.short_description ?? "",
    targetAudience: apiCourse.target_audience ?? "",
    level: (apiCourse.level as Level) ?? "",
    contentStyle: apiCourse.content_style ?? "",
    learningObjectives: apiCourse.learning_objectives || [],
    status: apiCourse.status,
    modules: (apiCourse.modules || []).map(mapModule),
  }
}

export async function fetchCourses(): Promise<Course[]> {
  const payload = await request<CoursesResponse>("/courses/")
  return payload.data.map(mapCourse)
}

export async function fetchCourse(courseId: string): Promise<Course> {
  const payload = await request<ApiCourse>(`/courses/${courseId}`)
  return mapCourse(payload)
}

export async function createCourse(payload: {
  title: string
  shortDescription?: string
  targetAudience?: string
  level?: string
  contentStyle?: string
  learningObjectives?: string[]
  modules?: { title: string; description?: string }[]
  status?: CourseStatus
}): Promise<Course> {
  const body = {
    title: payload.title,
    short_description: payload.shortDescription,
    target_audience: payload.targetAudience,
    level: payload.level,
    content_style: payload.contentStyle,
    status: payload.status ?? "IN_PROGRESS",
    learning_objectives: payload.learningObjectives ?? [],
    modules: (payload.modules || []).map((mod, index) => ({
      title: mod.title,
      description: mod.description,
      order: index + 1,
      outline_confirmed: true,
    })),
  }

  const data = await request<ApiCourse>("/courses/", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return mapCourse(data)
}

export async function saveModuleLessons(
  moduleId: string,
  lessons: { id?: string; title: string; summary?: string; order?: number }[],
): Promise<Module> {
  const payload = {
    lessons: lessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      order: lesson.order ?? index + 1,
    })),
  }
  const module = await request<ApiModule>(`/courses/modules/${moduleId}/lessons`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return mapModule(module)
}

export async function updateLessonContent(
  lessonId: string,
  content: Partial<LessonContent>,
  status?: LessonStatus,
): Promise<Lesson> {
  const payload: Record<string, unknown> = {
    content,
  }
  if (status) {
    payload.status = status
  }
  const lesson = await request<ApiLesson>(`/courses/lessons/${lessonId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return mapLesson(lesson)
}

export async function saveLessonQuiz(
  lessonId: string,
  questions: QuizQuestion[],
  status: LessonStatus = "CONFIRMED",
): Promise<Lesson> {
  const lesson = await request<ApiLesson>(`/courses/lessons/${lessonId}/quiz`, {
    method: "PUT",
    body: JSON.stringify({ quiz: questions, status }),
  })
  return mapLesson(lesson)
}
