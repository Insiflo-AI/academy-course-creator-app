import { Box, Flex, HStack, Text, VStack, Icon, Progress, Badge } from "@chakra-ui/react"
import { Link, useRouterState } from "@tanstack/react-router"
import { FaCheckCircle, FaRegCircle, FaRegDotCircle, FaBook, FaList, FaPen, FaQuestionCircle } from "react-icons/fa"

import { Course, Module, Lesson } from "@/client/types"  // Assuming types exist, or define inline

interface SidebarProps {
    course: Course
}

export function ProgressSidebar({ course }: SidebarProps) {
    // Simple progress calc
    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
    const confirmedLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.filter(l => l.status === "CONFIRMED").length || 0), 0) || 0
    const progressPercent = totalLessons === 0 ? 0 : (confirmedLessons / totalLessons) * 100

    return (
        <Box w="280px" h="100vh" borderRightWidth="1px" bg="gray.50" overflowY="auto" flexShrink={0}>
            <Box p={4} borderBottomWidth="1px">
                <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{course.title}</Text>
                <VStack align="start" mt={2} gap={1}>
                    <Text fontSize="xs" color="gray.500">Progress: {Math.round(progressPercent)}%</Text>
                    <Progress.Root value={progressPercent} size="sm" w="full" colorPalette="purple">
                        <Progress.Track>
                            <Progress.Range />
                        </Progress.Track>
                    </Progress.Root>
                </VStack>
            </Box>

            <VStack align="stretch" gap={0}>
                {/* Introduction / Outline Link */}
                <Link to={`/creator/courses/${course.id}/outline`}>
                    {({ isActive }) => (
                        <HStack p={3} bg={isActive ? "purple.50" : "transparent"} _hover={{ bg: "gray.100" }} cursor="pointer">
                            <Icon as={FaList} color={isActive ? "purple.500" : "gray.400"} />
                            <Text fontSize="sm" fontWeight={isActive ? "semibold" : "normal"}>Outline</Text>
                        </HStack>
                    )}
                </Link>

                {/* Modules Loop */}
                {course.modules?.map((module, mIdx) => (
                    <Box key={module.id}>
                        <Link to={`/creator/modules/${module.id}/lessons`}>
                            {({ isActive }) => (
                                <HStack p={3} bg={isActive ? "purple.50" : "transparent"} _hover={{ bg: "gray.100" }}>
                                    <Badge size="xs" colorPalette="gray">{mIdx + 1}</Badge>
                                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{module.title}</Text>
                                </HStack>
                            )}
                        </Link>

                        {/* Nested Lessons */}
                        <VStack align="stretch" gap={0} pl={9}>
                            {module.lessons?.map((lesson) => (
                                <Link key={lesson.id} to={`/creator/lessons/${lesson.id}`}>
                                    {({ isActive }) => (
                                        <HStack py={2} pr={2} bg={isActive ? "purple.50" : "transparent"} borderLeftWidth="2px" borderColor={isActive ? "purple.500" : "transparent"} _hover={{ bg: "gray.100" }}>
                                            <StatusIcon status={lesson.status} />
                                            <Text fontSize="xs" noOfLines={1} color={isActive ? "gray.900" : "gray.600"}>{lesson.title}</Text>
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
    if (status === "CONFIRMED") return <Icon as={FaCheckCircle} color="green.500" size="xs" boxSize={3} />
    if (status === "DRAFT") return <Icon as={FaRegDotCircle} color="orange.400" size="xs" boxSize={3} />
    return <Icon as={FaRegCircle} color="gray.300" size="xs" boxSize={3} />
}

export function TopStepper({ currentStep }: { currentStep: string }) {
    const steps = ["Setup", "Outline", "Lessons", "Content", "Quiz"]
    const currentIdx = steps.indexOf(currentStep)

    return (
        <Flex h="60px" borderBottomWidth="1px" align="center" px={6} bg="white">
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
                                <Box w={8} h="1px" bg="gray.200" />
                            )}
                        </HStack>
                    )
                })}
            </HStack>
            <HStack>
                {/* User Profile or Actions could go here */}
            </HStack>
        </Flex>
    )
}
