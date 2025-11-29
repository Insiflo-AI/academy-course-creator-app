/// <reference types="vite/client" />
// @ts-nocheck
import { Box, Button, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateLessonContent } from "@/lib/aiClient"
import { useCreatorData } from "@/hooks/useCreatorData"
import type { Course, Lesson } from "@/types/course"

export const Route = createFileRoute("/creator/lessons/$lessonId/")({
  component: LessonContentPage,
})

const fields: (keyof Lesson["content"])[] = [
  "definition",
  "keyComponentsAndTerms",
  "crossTopics",
  "outcomesProsCons",
  "scenariosApplications",
  "exercises",
  "nextLessonTeaser",
]

function LessonContentPage() {
  const { lessonId } = useParams({ from: "/creator/lessons/$lessonId/" })
  const { courses, saveLessonContent } = useCreatorData()
  const course = courses.find((c) => c.modules.some((m) => m.lessons.some((l) => l.id === lessonId))) as Course
  const module = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId))!
  const lesson = module.lessons.find((l) => l.id === lessonId) as Lesson
  const [content, setContent] = useState(lesson.content)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setContent(lesson.content)
  }, [lesson])

  const handleGenerate = async () => {
    setLoading(true)
    const aiContent = await generateLessonContent({
      course_title: course.title,
      level: course.level,
      targetAudience: course.targetAudience,
      contentStyle: course.contentStyle,
      module_title: module.title,
      lesson_title: lesson.title,
    })
    setContent(aiContent)
    setLoading(false)
  }

  const handleSave = (status: "DRAFT" | "CONFIRMED") => {
    saveLessonContent(lessonId, content, status)
  }

  return (
    <CreatorLayoutShell course={course} currentStep="Content">
      <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontWeight="semibold">Lesson title</Text>
            <Input value={lesson.title} readOnly />
          </Box>
          {fields.map((field) => (
            <Box key={field}>
              <Text fontWeight="semibold" textTransform="capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </Text>
              <Textarea
                value={content[field]}
                onChange={(e) => setContent((prev) => ({ ...prev, [field]: e.target.value }))}
                rows={4}
              />
            </Box>
          ))}
          <VStack align="stretch" gap={3}>
            <Button onClick={handleGenerate} loading={loading} variant="outline">
              Generate AI draft
            </Button>
            <Button onClick={() => handleSave("DRAFT")}>Save draft</Button>
            <Button colorPalette="purple" onClick={() => handleSave("CONFIRMED")}>
              Mark lesson as complete
            </Button>
            <Link to={`/creator/lessons/${lessonId}/quiz`} params={{ lessonId }}>
              <Button variant="ghost">Go to quiz</Button>
            </Link>
          </VStack>
        </VStack>
      </Box>
    </CreatorLayoutShell>
  )
}
