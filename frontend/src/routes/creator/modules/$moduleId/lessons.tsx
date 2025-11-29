/// <reference types="vite/client" />
// @ts-nocheck
import { Box, Button, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateModuleLessons } from "@/lib/aiClient"
import { useCreatorData } from "@/hooks/useCreatorData"
import type { Module } from "@/types/course"

export const Route = createFileRoute("/creator/modules/$moduleId/lessons")({
  component: ModuleLessonsPage,
})

function ModuleLessonsPage() {
  const { moduleId } = useParams({ from: "/creator/modules/$moduleId/lessons" })
  const { courses, saveLessons } = useCreatorData()
  const navigate = useNavigate({ from: "/creator/modules/$moduleId/lessons" })
  const course = courses.find((c) => c.modules.some((m) => m.id === moduleId))!
  const module = course.modules.find((m) => m.id === moduleId) as Module
  const [rows, setRows] = useState(
    module.lessons.length ? module.lessons.map((l) => ({ title: l.title, summary: l.summary || "" })) : [],
  )

  const handleSuggest = async () => {
    const aiLessons = await generateModuleLessons({
      course_title: course.title,
      learning_objectives: course.learningObjectives,
      level: course.level,
      targetAudience: course.targetAudience,
      contentStyle: course.contentStyle,
      module_title: module.title,
      module_description: module.description,
    })
    setRows(aiLessons.lessons)
  }

  const handleConfirm = () => {
    const nextLessons = saveLessons(moduleId, rows)
    const firstLesson = nextLessons[0] || module.lessons[0]
    if (firstLesson) {
      navigate({ to: `/creator/lessons/${firstLesson.id}` })
    }
  }

  return (
    <CreatorLayoutShell course={course} currentStep="Lessons">
      <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
        <VStack align="stretch" gap={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Text fontWeight="bold">Module</Text>
              <Text>{module.title}</Text>
            </Box>
            <Button onClick={handleSuggest} variant="outline">
              Suggest lessons with AI
            </Button>
          </Box>
          <VStack align="stretch" gap={3}>
            {rows.map((lesson, index) => (
              <Box key={index} borderWidth="1px" borderRadius="md" p={3}>
                <Text fontWeight="semibold">Lesson title</Text>
                <Input
                  value={lesson.title}
                  onChange={(e) =>
                    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)))
                  }
                />
                <Text mt={2} fontWeight="semibold">
                  Summary
                </Text>
                <Textarea
                  value={lesson.summary}
                  onChange={(e) =>
                    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, summary: e.target.value } : row)))
                  }
                />
              </Box>
            ))}
          </VStack>
          <Button onClick={() => setRows((prev) => [...prev, { title: "New lesson", summary: "" }])}>Add lesson</Button>
          <Button onClick={handleConfirm} colorPalette="purple">
            Confirm lesson list
          </Button>
        </VStack>
      </Box>
    </CreatorLayoutShell>
  )
}
