/// <reference types="vite/client" />
import { Box, Button, Input, Text, Textarea, VStack, Heading, Card, HStack, Icon, Spinner } from "@chakra-ui/react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { FaMagic, FaSave, FaCheckCircle, FaArrowRight } from "react-icons/fa"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { defaultLessonContent } from "@/lib/courseDefaults"
import { generateLessonContent } from "@/lib/aiClient"
import { isLoggedIn } from "@/hooks/useAuth"
import { useCreatorData } from "@/hooks/useCreatorData"

export const Route = createFileRoute("/creator/lessons/$lessonId/")({
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
  component: LessonContentPage,
})

const fields = [
  { key: "definition", label: "Definition" },
  { key: "keyComponentsAndTerms", label: "Key Components & Terms" },
  { key: "crossTopics", label: "Cross Topics" },
  { key: "outcomesProsCons", label: "Outcomes / Pros & Cons" },
  { key: "scenariosApplications", label: "Scenarios & Applications" },
  { key: "exercises", label: "Exercises" },
  { key: "nextLessonTeaser", label: "Next Lesson Teaser" },
]

function LessonContentPage() {
  const { lessonId } = Route.useParams()
  const { courses, saveLessonContent, isLoading } = useCreatorData()
  const navigate = useNavigate()

  // Find hierarchy
  const course = courses.find((c) => c.modules?.some((m) => m.lessons?.some((l) => l.id === lessonId)))
  const module = course?.modules?.find((m) => m.lessons?.some((l) => l.id === lessonId))
  const lesson = module?.lessons?.find((l) => l.id === lessonId)

  // Local state for edits
  const [content, setContent] = useState(defaultLessonContent)
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    if (lesson?.content) {
      setContent({ ...defaultLessonContent, ...lesson.content })
    }
  }, [lesson])

  const handleGenerate = async () => {
    if (!course || !module || !lesson) return
    setIsAiLoading(true)
    try {
      const aiContent = await generateLessonContent({
        course_title: course.title,
        level: course.level || undefined,
        targetAudience: course.target_audience || undefined,
        contentStyle: course.content_style || undefined,
        module_title: module.title,
        lesson_title: lesson.title,
      })
      setContent(aiContent)
    } catch (e) {
      console.error("AI Gen Failed", e)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSave = async (status: "DRAFT" | "CONFIRMED") => {
    if (!lesson) return
    const updated = await saveLessonContent(lessonId, content, status)
    if (updated && status === "CONFIRMED") {
      // Optionally navigate to quiz
    }
  }

  if (isLoading || !course || !module || !lesson) return <Spinner />

  return (
    <CreatorLayoutShell course={course} currentStep="Content">
      <VStack align="stretch" gap={6} maxW="4xl" mx="auto">
        <Box>
          <Text color="purple.600" fontSize="sm" fontWeight="bold">{module.title}</Text>
          <Heading size="lg">{lesson.title}</Heading>
        </Box>

        <Flex justify="flex-end">
          <Button onClick={handleGenerate} loading={isAiLoading} variant="outline" colorPalette="purple">
            <Icon as={FaMagic} mr={2} /> Generate Content with AI
          </Button>
        </Flex>

        <VStack align="stretch" gap={6}>
          {fields.map((f) => (
            <Box key={f.key}>
              <Text fontWeight="bold" mb={2}>{f.label}</Text>
              <Textarea
                value={(content as any)[f.key] || ""}
                onChange={(e) => setContent((prev) => ({ ...prev, [f.key]: e.target.value }))}
                rows={5}
                bg="white"
              />
            </Box>
          ))}
        </VStack>

        <HStack justify="flex-end" pt={4} borderTopWidth="1px" gap={4}>
          <Button variant="ghost" onClick={() => handleSave("DRAFT")}>
            <Icon as={FaSave} mr={2} /> Save Draft
          </Button>
          <Link to={`/creator/lessons/${lessonId}/quiz`} params={{ lessonId }}>
            <Button colorPalette="purple" onClick={() => handleSave("CONFIRMED")}>
              Confirm & Create Quiz <Icon as={FaArrowRight} ml={2} />
            </Button>
          </Link>
        </HStack>
      </VStack>
    </CreatorLayoutShell>
  )
}
