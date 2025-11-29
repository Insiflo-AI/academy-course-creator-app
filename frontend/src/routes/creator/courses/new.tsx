/// <reference types="vite/client" />
// @ts-nocheck
import { Box, Button, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateCourseOutline } from "@/lib/aiClient"
import { useCreatorData } from "@/hooks/useCreatorData"

export const Route = createFileRoute("/creator/courses/new")({
  component: NewCoursePage,
})

function NewCoursePage() {
  const [title, setTitle] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [level, setLevel] = useState("")
  const [contentStyle, setContentStyle] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate({ from: "/creator/courses/new" })
  const { createCourse, courses } = useCreatorData()
  const course = courses[0]

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const outline = await generateCourseOutline({
        title,
        shortDescription,
        targetAudience,
        level,
        contentStyle,
      })
      const newCourse = createCourse({
        title,
        shortDescription,
        targetAudience,
        level,
        contentStyle,
        learningObjectives: outline.learningObjectives,
        modules: outline.modules,
        status: "IN_PROGRESS",
      })
      console.info("AI outline drafted")
      navigate({ to: `/creator/courses/${newCourse.id}/outline` })
    } catch (error) {
      console.error("Could not draft outline")
    } finally {
      setLoading(false)
    }
  }

  return (
    <CreatorLayoutShell course={course} currentStep="Setup">
      <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontWeight="semibold">Course title</Text>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Modern Data Ethics" />
          </Box>
          <Box>
            <Text fontWeight="semibold">Short description</Text>
            <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
          </Box>
          <Box>
            <Text fontWeight="semibold">Target audience</Text>
            <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </Box>
          <Box>
            <Text fontWeight="semibold">Level</Text>
            <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="BEGINNER / INTERMEDIATE / ADVANCED" />
          </Box>
          <Box>
            <Text fontWeight="semibold">Content style</Text>
            <Input value={contentStyle} onChange={(e) => setContentStyle(e.target.value)} />
          </Box>
          <Button onClick={handleSubmit} loading={loading} colorPalette="purple">
            Generate outline with AI
          </Button>
        </VStack>
      </Box>
    </CreatorLayoutShell>
  )
}
