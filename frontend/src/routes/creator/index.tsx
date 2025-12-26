/// <reference types="vite/client" />
import { Box, Button, Flex, Heading, Text, VStack, Card, Badge, HStack, Progress, Icon } from "@chakra-ui/react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { FaPlay, FaPlus } from "react-icons/fa"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { isLoggedIn } from "@/hooks/useAuth"
import { useCreatorData } from "@/hooks/useCreatorData"
import type { Course } from "@/types/course"

export const Route = createFileRoute("/creator/")({
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
  component: CreatorDashboard,
})

function computeProgress(course: any) {
  const totalLessons = course.modules?.reduce((acc: any, m: any) => acc + (m.lessons?.length || 0), 0) || 0
  const confirmedLessons = course.modules?.reduce((acc: any, m: any) => acc + (m.lessons?.filter((l: any) => l.status === "CONFIRMED").length || 0), 0) || 0
  const percent = totalLessons === 0 ? 0 : Math.round((confirmedLessons / totalLessons) * 100)
  return { percent, totalLessons, confirmedLessons }
}

function findResumePath(course: any) {
  // If no learning objectives, go to outline
  if (!course.learning_objectives || course.learning_objectives.length === 0) {
    return `/creator/courses/${course.id}/outline`
  }

  // Find first module without confirmed outline? (Simulated by checking if it has lessons maybe?)
  // Actually, let's just checking for empty lessons
  for (const mod of course.modules || []) {
    if (!mod.lessons || mod.lessons.length === 0) {
      return `/creator/modules/${mod.id}/lessons`
    }
    for (const lesson of mod.lessons) {
      if (lesson.status !== "CONFIRMED") {
        return `/creator/lessons/${lesson.id}`
      }
      // If confirmed, check if quiz exists? (Simplification: just check lesson content status for now)
    }
  }

  // If all complete, go to outline or publish page (not implemented yet)
  return `/creator/courses/${course.id}/outline`
}

function CreatorDashboard() {
  const { courses, isLoading } = useCreatorData()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Box p={8} bg="gray.50" minH="100vh">
        <Text>Loading your workspace...</Text>
      </Box>
    )
  }

  // If no courses, show empty state or just the "New Course" button
  // For the LayoutShell to work, we need *a* course context usually, but the dashboard is an exception.
  // We can render a simpler layout or just a list.

  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      <Box maxW="5xl" mx="auto">
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="2xl" mb={2}>Creator Dashboard</Heading>
            <Text color="gray.500">Manage your AI-assisted courses</Text>
          </Box>
          <Link to="/creator/courses/new">
            <Button size="lg" colorPalette="purple">
              <Icon as={FaPlus} mr={2} /> New Course
            </Button>
          </Link>
        </Flex>

        {courses.length === 0 ? (
          <Card.Root>
            <Card.Body p={10} textAlign="center">
              <Text fontSize="lg" color="gray.500" mb={4}>You haven't created any courses yet.</Text>
              <Link to="/creator/courses/new">
                <Button variant="outline" colorPalette="purple">Get Started</Button>
              </Link>
            </Card.Body>
          </Card.Root>
        ) : (
          <VStack align="stretch" gap={4}>
            {courses.map(course => {
              const { percent, confirmedLessons, totalLessons } = computeProgress(course)
              return (
                <Card.Root key={course.id} direction={{ base: "column", sm: "row" }} overflow="hidden" variant="elevated">
                  <Box p={6} flex="1">
                    <HStack justify="space-between" mb={2}>
                      <Badge colorPalette={course.status === "PUBLISHED" ? "green" : "blue"}>{course.status}</Badge>
                      <Text fontSize="xs" color="gray.400">Last updated recently</Text>
                    </HStack>
                    <Heading size="md" mb={2}>{course.title}</Heading>
                    <Text color="gray.600" fontSize="sm" lineClamp={2} mb={4}>{course.shortDescription || "No description provided."}</Text>

                    <VStack align="stretch" gap={1}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold" color="gray.500">{percent}% Complete</Text>
                        <Text fontSize="xs" color="gray.400">{confirmedLessons}/{totalLessons} Lessons</Text>
                      </HStack>
                      <Progress.Root value={percent} size="sm" colorPalette="purple">
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                    </VStack>
                  </Box>
                  <Flex p={6} bg="gray.100" align="center" justify="center" minW="200px">
                    <Link to={findResumePath(course)}>
                      <Button colorPalette="purple" variant="solid">
                        <Icon as={FaPlay} mr={2} /> Continue
                      </Button>
                    </Link>
                  </Flex>
                </Card.Root>
              )
            })}
          </VStack>
        )}
      </Box>
    </Box>
  )
}
