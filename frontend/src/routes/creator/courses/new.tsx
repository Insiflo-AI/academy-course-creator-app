/// <reference types="vite/client" />
import { Box, Button, Flex, Heading, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateCourseOutline } from "@/lib/aiClient"
import { useCreatorData } from "@/hooks/useCreatorData"
import { isLoggedIn } from "@/hooks/useAuth"

// ... imports ...

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
  const { createCourse, isLoading } = useCreatorData()

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
        level: level as any, // Temporary cast or ensure specific type match
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
        <Text>Loading...</Text>
      </Box>
    )
  }

  return (
    <CreatorLayoutShell currentStep="Setup">
      <Box minH="full">
        <Heading size="lg" mb={6}>Create your first course</Heading>
        <Box borderWidth="1px" borderRadius="md" p={6} bg="white" shadow="sm">
          <VStack align="stretch" gap={6}>
            <Box>
              <Text fontWeight="semibold" mb={2}>Course title</Text>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Modern Data Ethics" size="lg" />
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>Short description</Text>
              <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="What will students learn?" rows={3} />
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>Target audience</Text>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g., Data Scientists" />
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>Level</Text>
              <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="BEGINNER / INTERMEDIATE / ADVANCED" />
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>Content style</Text>
              <Input value={contentStyle} onChange={(e) => setContentStyle(e.target.value)} placeholder="e.g., Professional, Casual, Academic" />
            </Box>
            <Flex justify="flex-end" pt={4}>
              <Button onClick={handleSubmit} loading={loading} colorPalette="purple" size="lg">
                Generate outline with AI
              </Button>
            </Flex>
          </VStack>
        </Box>
      </Box>
    </CreatorLayoutShell>
  )
}
