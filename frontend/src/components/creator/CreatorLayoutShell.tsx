import { Box, Flex, HStack, Text, VStack, Icon, Progress, Badge } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaCheckCircle, FaRegCircle, FaRegDotCircle, FaList } from "react-icons/fa"
import { type PropsWithChildren } from "react"
// @ts-ignore
import type { Course } from "@/types/course"

interface SidebarProps {
  course: Course
}

function ProgressSidebar({ course }: SidebarProps) {
  const totalLessons = course.modules?.reduce((acc: any, m: any) => acc + (m.lessons?.length || 0), 0) || 0
  const confirmedLessons = course.modules?.reduce((acc: any, m: any) => acc + (m.lessons?.filter((l: any) => l.status === "CONFIRMED").length || 0), 0) || 0
  const progressPercent = totalLessons === 0 ? 0 : (confirmedLessons / totalLessons) * 100

  return (
    <Box w="280px" h="100vh" borderRightWidth="1px" bg="gray.50" overflowY="auto" flexShrink={0} position="sticky" top={0}>
      <Box p={4} borderBottomWidth="1px" bg="white">
        <Text fontWeight="bold" fontSize="lg" lineClamp={1}>{course.title}</Text>
        <VStack align="start" mt={2} gap={1} w="full">
          <HStack justify="space-between" w="full">
            <Text fontSize="xs" color="gray.500">Progress</Text>
            <Text fontSize="xs" fontWeight="bold">{Math.round(progressPercent)}%</Text>
          </HStack>
          <Progress.Root value={progressPercent} size="xs" w="full" colorPalette="purple">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </VStack>
      </Box>

      <VStack align="stretch" gap={0}>
        <Link to="/creator/courses/$courseId/outline" params={{ courseId: course.id }}>
          {({ isActive }) => (
            <HStack p={3} bg={isActive ? "purple.50" : "transparent"} borderLeftWidth="3px" borderColor={isActive ? "purple.500" : "transparent"} _hover={{ bg: "gray.100" }} cursor="pointer">
              <Icon as={FaList} color={isActive ? "purple.500" : "gray.400"} />
              <Text fontSize="sm" fontWeight={isActive ? "semibold" : "normal"}>Outline</Text>
            </HStack>
          )}
        </Link>

        {course.modules?.map((module: any, mIdx: number) => (
          <Box key={module.id}>
            <Link to="/creator/modules/$moduleId/lessons" params={{ moduleId: module.id }}>
              {({ isActive }) => (
                <HStack p={3} bg={isActive ? "purple.50" : "transparent"} borderLeftWidth="3px" borderColor={isActive ? "purple.500" : "transparent"} _hover={{ bg: "gray.100" }}>
                  <Badge size="sm" variant="subtle" colorPalette="gray">{mIdx + 1}</Badge>
                  <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{module.title}</Text>
                </HStack>
              )}
            </Link>

            <VStack align="stretch" gap={0} pl={0}>
              {module.lessons?.map((lesson: any) => (
                <Link key={lesson.id} to="/creator/lessons/$lessonId" params={{ lessonId: lesson.id }}>
                  {({ isActive }) => (
                    <HStack py={2} pl={10} pr={2} bg={isActive ? "purple.50" : "transparent"} _hover={{ bg: "gray.100" }}>
                      <StatusIcon status={lesson.status} />
                      <Text fontSize="xs" lineClamp={1} fontWeight={isActive ? "semibold" : "normal"} color={isActive ? "gray.900" : "gray.600"}>{lesson.title}</Text>
                    </HStack>
                  )}
                </Link>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "CONFIRMED") return <Icon as={FaCheckCircle} color="green.500" boxSize={3} />
  if (status === "DRAFT") return <Icon as={FaRegDotCircle} color="orange.400" boxSize={3} />
  return <Icon as={FaRegCircle} color="gray.300" boxSize={3} />
}

function TopStepper({ currentStep }: { currentStep: string }) {
  const steps = ["Setup", "Outline", "Lessons", "Content", "Quiz"]
  const currentIdx = steps.indexOf(currentStep)

  return (
    <Flex h="60px" borderBottomWidth="1px" align="center" px={6} bg="white" position="sticky" top={0} zIndex={10}>
      <HStack flex={1} gap={4}>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx
          const isCurrent = idx === currentIdx

          return (
            <HStack key={step} gap={2}>
              <Flex
                boxSize={6}
                borderRadius="full"
                bg={isCompleted || isCurrent ? "purple.600" : "gray.200"}
                color="white"
                align="center"
                justify="center"
                fontSize="xs"
                fontWeight="bold"
              >
                {idx + 1}
              </Flex>
              <Text fontSize="sm" fontWeight={isCurrent ? "bold" : "medium"} color={isCurrent ? "gray.900" : "gray.500"}>
                {step}
              </Text>
              {idx < steps.length - 1 && (
                <Box w={8} h="1px" bg="gray.200" display={{ base: "none", md: "block" }} />
              )}
            </HStack>
          )
        })}
      </HStack>
    </Flex>
  )
}

interface CreatorLayoutProps extends PropsWithChildren {
  course?: any
  currentStep: string
}

export function CreatorLayoutShell({ children, course, currentStep }: CreatorLayoutProps) {
  return (
    <Flex h="100vh" w="100vw" overflow="hidden" bg="white">
      {course && <ProgressSidebar course={course} />}
      <Flex direction="column" flex="1" overflow="hidden">
        <TopStepper currentStep={currentStep} />
        <Box flex="1" overflowY="auto" bg="gray.50" p={8}>
          <Box maxW="5xl" mx="auto">
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  )
}
