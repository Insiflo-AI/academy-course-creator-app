/// <reference types="vite/client" />
import { Box, Button, Heading, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateCourseOutline } from "@/lib/aiClient"
import { useCreatorData } from "@/hooks/useCreatorData"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/creator/courses/new")({
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
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
  const { createCourse, courses, isLoading } = useCreatorData()
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
      const newCourse = await createCourse({
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
      const nextModule = newCourse.modules[0]
      navigate({
        to: nextModule ? `/creator/modules/${nextModule.id}/lessons` : "/creator/",
      })
    } catch (error) {
      console.error("Could not draft outline")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Box bg="white" borderRadius="md" p={6}>
        <Text>Loading courses...</Text>
      </Box>
    )
  }

  const form = (
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
        <Button onClick={handleSubmit} isLoading={loading} colorPalette="purple">
          Generate outline with AI
        </Button>
      </VStack>
    </Box>
  )

  if (!course) {
    return (
      <Box>
        <Heading size="lg" mb={4}>
          Create your first course
        </Heading>
        {form}
      </Box>
    )
  }

  return (
    <CreatorLayoutShell course={course} currentStep="Setup">
      {form}
    </CreatorLayoutShell>
  )
}
