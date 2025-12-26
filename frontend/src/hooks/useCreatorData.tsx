import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  createCourse as apiCreateCourse,
  fetchCourse,
  fetchCourses,
  saveLessonQuiz,
  saveModuleLessons,
  updateLessonContent,
} from "@/lib/courseApi"
import type { Course, Lesson, LessonContent, LessonStatus, QuizQuestion } from "@/types/course"
import useCustomToast from "./useCustomToast"

import { isLoggedIn } from "@/hooks/useAuth"

interface CreatorState {
  courses: Course[]
  isLoading: boolean
  refreshCourses: () => Promise<void>
  createCourse: (
    course: Omit<Course, "id" | "modules" | "learningObjectives"> & {
      learningObjectives?: string[]
      modules?: { title: string; description?: string }[]
    },
  ) => Promise<Course>
  saveLessons: (moduleId: string, lessons: { id?: string; title: string; summary?: string }[]) => Promise<Lesson[]>
  saveLessonContent: (lessonId: string, content: Partial<LessonContent>, status?: LessonStatus) => Promise<void>
  saveQuiz: (lessonId: string, questions: QuizQuestion[]) => Promise<void>
}

const CreatorDataContext = createContext<CreatorState | undefined>(undefined)

export function CreatorDataProvider({ children }: PropsWithChildren) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const refreshCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchCourses()
      setCourses(data)
    } catch (error) {
      console.error("Failed to load courses", error)
      showErrorToast("Failed to load courses. Please try refreshing.")
    } finally {
      setIsLoading(false)
    }
  }, [showErrorToast])

  const refreshCourse = useCallback(async (courseId: string) => {
    try {
      const nextCourse = await fetchCourse(courseId)
      setCourses((prev) => {
        const others = prev.filter((course) => course.id !== courseId)
        return [...others, nextCourse]
      })
      return nextCourse
    } catch (error) {
      console.error("Failed to refresh course", error)
      showErrorToast("Could not fetch latest course data.")
      throw error
    }
  }, [showErrorToast])


  // ... imports remain the same ...

  useEffect(() => {
    if (isLoggedIn()) {
      void refreshCourses()
    } else {
      setIsLoading(false)
    }
  }, [refreshCourses])

  const createCourse: CreatorState["createCourse"] = useCallback(async (courseInput) => {
    try {
      const created = await apiCreateCourse(courseInput)
      setCourses((prev) => [...prev, created])
      showSuccessToast("Course created successfully.")
      return created
    } catch (error) {
      showErrorToast("Could not create the course.")
      throw error
    }
  }, [showSuccessToast, showErrorToast])

  const saveLessons: CreatorState["saveLessons"] = useCallback(
    async (moduleId, lessons) => {
      try {
        const parentCourse = courses.find((course) => course.modules.some((mod) => mod.id === moduleId))
        const existingModule = parentCourse?.modules.find((mod) => mod.id === moduleId)
        const payload = lessons.map((lesson, index) => ({
          id: lesson.id ?? existingModule?.lessons[index]?.id,
          title: lesson.title,
          summary: lesson.summary,
          order: index + 1,
        }))

        const module = await saveModuleLessons(moduleId, payload)
        const courseId = parentCourse?.id || module.courseId
        if (courseId) {
          const updatedCourse = await refreshCourse(courseId)
          const updatedModule = updatedCourse.modules.find((mod) => mod.id === moduleId)
          return updatedModule?.lessons ?? module.lessons
        }
        showSuccessToast("Lessons saved and outline updated.")
        return module.lessons
      } catch (error) {
        showErrorToast("Could not save lessons.")
        throw error
      }
    },
    [courses, refreshCourse, showSuccessToast, showErrorToast],
  )

  const saveLessonContent: CreatorState["saveLessonContent"] = useCallback(
    async (lessonId, content, status) => {
      try {
        const parentCourse = courses.find((course) =>
          course.modules.some((mod) => mod.lessons.some((lesson) => lesson.id === lessonId)),
        )
        await updateLessonContent(lessonId, content, status)
        if (parentCourse) {
          await refreshCourse(parentCourse.id)
        }
        if (status === "CONFIRMED") {
          showSuccessToast("Lesson confirmed and saved.")
        }
      } catch (error) {
        showErrorToast("Could not save lesson content.")
        throw error
      }
    },
    [courses, refreshCourse, showSuccessToast, showErrorToast],
  )

  const saveQuiz: CreatorState["saveQuiz"] = useCallback(
    async (lessonId, questions) => {
      try {
        const parentCourse = courses.find((course) =>
          course.modules.some((mod) => mod.lessons.some((lesson) => lesson.id === lessonId)),
        )
        await saveLessonQuiz(lessonId, questions, "CONFIRMED")
        if (parentCourse) {
          await refreshCourse(parentCourse.id)
        }
        showSuccessToast("Quiz questions confirmed.")
      } catch (error) {
        showErrorToast("Could not save quiz.")
        throw error
      }
    },
    [courses, refreshCourse, showSuccessToast, showErrorToast],
  )

  const value = useMemo(
    () => ({
      courses,
      isLoading,
      refreshCourses,
      createCourse,
      saveLessons,
      saveLessonContent,
      saveQuiz,
    }),
    [courses, isLoading, refreshCourses, createCourse, saveLessons, saveLessonContent, saveQuiz],
  )

  return <CreatorDataContext.Provider value={value}>{children}</CreatorDataContext.Provider>
}

export function useCreatorData() {
  const ctx = useContext(CreatorDataContext)
  if (!ctx) throw new Error("useCreatorData must be used within CreatorDataProvider")
  return ctx
}
