export type CourseStatus = "DRAFT" | "IN_PROGRESS" | "PUBLISHED" | "ARCHIVED"
export type LessonStatus = "NOT_STARTED" | "DRAFT" | "CONFIRMED"
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | ""

export interface LessonContent {
  definition: string
  keyComponentsAndTerms: string
  crossTopics: string
  outcomesProsCons: string
  scenariosApplications: string
  exercises: string
  nextLessonTeaser: string
}

export interface QuizQuestion {
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export interface Lesson {
  id: string
  title: string
  summary?: string
  order: number
  status: LessonStatus
  content: LessonContent
  quiz: QuizQuestion[]
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  outlineConfirmed: boolean
  lessons: Lesson[]
}

export interface Course {
  id: string
  ownerId?: string
  title: string
  shortDescription?: string
  targetAudience?: string
  level?: Level
  contentStyle?: string
  learningObjectives: string[]
  status: CourseStatus
  modules: Module[]
}

export interface CourseOutlineResponse {
  learningObjectives: string[]
  modules: { title: string; description: string }[]
  draft?: string
}

export interface ModuleLessonResponse {
  lessons: { title: string; summary: string }[]
}

export interface LessonContentResponse extends LessonContent {}

export interface LessonQuizResponse {
  questions: QuizQuestion[]
}
