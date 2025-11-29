// @ts-nocheck
import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiCheckCircle, FiCircle, FiEdit3 } from "react-icons/fi"

import type { Course, LessonStatus } from "@/types/course"

function lessonStatusIcon(status: LessonStatus) {
  if (status === "CONFIRMED") return <FiCheckCircle color="#16a34a" />
  if (status === "DRAFT") return <FiEdit3 color="#f97316" />
  return <FiCircle color="#a3a3a3" />
}

function computeProgress(course: Course) {
  const lessons = course.modules.flatMap((m) => m.lessons)
  const confirmed = lessons.filter((l) => l.status === "CONFIRMED").length
  const total = Math.max(lessons.length, 1)
  return Math.round((confirmed / total) * 100)
}

export function ProgressSidebar({ course }: { course: Course }) {
  const progress = computeProgress(course)
  return (
    <Box w={{ base: "100%", md: "320px" }} borderRightWidth="1px" p={4} bg="gray.50">
      <Heading size="md" mb={2}>
        {course.title}
      </Heading>
      <Text color="gray.600" mb={4}>
        Progress across confirmed lessons
      </Text>
      <Box bg="gray.200" borderRadius="full" h="2" mb={6}>
        <Box bg="purple.500" w={`${progress}%`} h="full" borderRadius="full" />
      </Box>
      <VStack align="stretch" gap={3}>
        {course.modules.map((module) => (
          <Box key={module.id} borderWidth="1px" borderRadius="md" p={3} bg="white">
            <Link to={`/creator/modules/${module.id}/lessons`}>
              <Flex align="center" gap={2} fontWeight="semibold">
                {module.outlineConfirmed ? <FiCheckCircle /> : <FiCircle />} {module.title}
              </Flex>
            </Link>
            <VStack align="stretch" gap={2} mt={2} pl={4}>
              {module.lessons.map((lesson) => (
                <Flex key={lesson.id} align="center" gap={2}>
                  {lessonStatusIcon(lesson.status)}
                  <Link to={`/creator/lessons/${lesson.id}`}>
                    <Text>{lesson.title}</Text>
                  </Link>
                </Flex>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
