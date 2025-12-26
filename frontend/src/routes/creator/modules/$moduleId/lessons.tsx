/// <reference types="vite/client" />
import { Box, Button, Heading, Text, VStack, HStack, Input, Textarea, Card, IconButton, Spinner, Icon, Flex } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { FaTrash, FaPlus, FaMagic, FaArrowRight } from "react-icons/fa"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { useCreatorData } from "@/hooks/useCreatorData"
import { isLoggedIn } from "@/hooks/useAuth"
import { generateModuleLessons } from "@/lib/aiClient"

export const Route = createFileRoute("/creator/modules/$moduleId/lessons")({
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
  component: ModuleLessonsPage,
})

function ModuleLessonsPage() {
  const { moduleId } = Route.useParams()
  const navigate = useNavigate()
  const { courses, saveLessons, isLoading: isDataLoading } = useCreatorData()

  // Find course and module
  const course = courses.find((c) => c.modules?.some((m) => m.id === moduleId))
  const module = course?.modules?.find((m) => m.id === moduleId)

  const [lessons, setLessons] = useState<{ title: string, summary: string }[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    if (module?.lessons) {
      setLessons(module.lessons.map(l => ({ title: l.title, summary: l.summary || "" })))
    }
  }, [module])

  const handleSuggest = async () => {
    if (!course || !module) return
    setIsAiLoading(true)
    try {
      const result = await generateModuleLessons({
        course_title: course.title,
        learning_objectives: course.learningObjectives,
        level: course.level || undefined,
        targetAudience: course.targetAudience || undefined,
        contentStyle: course.contentStyle || undefined,
        module_title: module.title,
        module_description: module.description || undefined
      })
      if (result.lessons) {
        setLessons(result.lessons)
      }
    } catch (e) {
      console.error("AI Error", e)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!module) return
    await saveLessons(module.id, lessons)
    navigate({ to: `/creator/courses/${course?.id}/outline` })
  }

  if (isDataLoading || !course || !module) return <Spinner />

  return (
    <CreatorLayoutShell course={course} currentStep="Lessons">
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg">{module.title}</Heading>
          <Text color="gray.500">{module.description}</Text>
        </Box>

        <Flex justify="space-between" align="center">
          <Heading size="md">Lesson Plan</Heading>
          <Button onClick={handleSuggest} loading={isAiLoading} variant="outline" colorPalette="purple">
            <Icon as={FaMagic} mr={2} /> Suggest Lessons
          </Button>
        </Flex>

        <VStack align="stretch" gap={4}>
          {lessons.map((lesson, i) => (
            <Card.Root key={i}>
              <Card.Body>
                <HStack align="start" gap={4}>
                  <Text fontWeight="bold" color="gray.300" fontSize="2xl">{i + 1}</Text>
                  <VStack align="stretch" flex={1}>
                    <Input value={lesson.title} onChange={(e) => {
                      const newL = [...lessons]
                      newL[i].title = e.target.value
                      setLessons(newL)
                    }} fontWeight="bold" placeholder="Lesson Title" />
                    <Input value={lesson.summary} onChange={(e) => {
                      const newL = [...lessons]
                      newL[i].summary = e.target.value
                      setLessons(newL)
                    }} placeholder="Short summary..." />
                  </VStack>
                  <IconButton aria-label="Delete" size="sm" colorPalette="red" variant="ghost" onClick={() => {
                    setLessons(lessons.filter((_, idx) => idx !== i))
                  }}>
                    <FaTrash />
                  </IconButton>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
          <Button variant="ghost" onClick={() => setLessons([...lessons, { title: "", summary: "" }])}>
            <Icon as={FaPlus} mr={2} /> Add Lesson
          </Button>
        </VStack>

        <Flex justify="flex-end">
          <Button size="lg" colorPalette="purple" onClick={handleConfirm}>
            Confirm Lessons <Icon as={FaArrowRight} ml={2} />
          </Button>
        </Flex>
      </VStack>
    </CreatorLayoutShell>
  )
}
