/// <reference types="vite/client" />
// @ts-nocheck
import { Box, Button, Flex, Heading, Text, VStack } from "@chakra-ui/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { useCreatorData } from "@/hooks/useCreatorData"

export const Route = createFileRoute("/creator/")({
  component: CreatorDashboard,
})

function computeProgressLabel(courseId: string, modulesCount: number, confirmedLessons: number) {
  return `Modules: ${modulesCount}, Confirmed lessons: ${confirmedLessons}`
}

function findFirstCoursePath(courseId: string) {
  return `/creator/courses/${courseId}/outline`
}

function CreatorDashboard() {
  const { courses } = useCreatorData()
  const navigate = useNavigate({ from: "/creator/" })

  if (!courses.length) return null

  const course = courses[0]
  const confirmedLessons = course.modules.flatMap((m) => m.lessons).filter((l) => l.status === "CONFIRMED").length

  return (
    <CreatorLayoutShell course={course} currentStep="Setup">
      <VStack align="stretch" gap={4}>
        <Heading size="lg">Course builder</Heading>
        <Text color="gray.600">Pick up where you left off or start a new course.</Text>
        <Link to="/creator/courses/new">
          <Button colorPalette="purple">Create new course</Button>
        </Link>
        <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
          <Heading size="md">{course.title}</Heading>
          <Text color="gray.600" mt={1}>
            {course.shortDescription}
          </Text>
          <Text mt={2} fontWeight="semibold" color="purple.600">
            {course.status}
          </Text>
          <Text mt={3}>{computeProgressLabel(course.id, course.modules.length, confirmedLessons)}</Text>
          <Button mt={4} onClick={() => navigate({ to: findFirstCoursePath(course.id) })}>
            Continue building
          </Button>
        </Box>
      </VStack>
    </CreatorLayoutShell>
  )
}
