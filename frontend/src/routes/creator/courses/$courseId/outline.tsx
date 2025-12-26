/// <reference types="vite/client" />
import { Box, Button, Heading, Text, VStack, HStack, Input, Textarea, Card, IconButton, Spinner, Flex, Icon } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { FaTrash, FaPlus, FaMagic } from "react-icons/fa"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { useCreatorData } from "@/hooks/useCreatorData"
import { isLoggedIn } from "@/hooks/useAuth"
import { generateCourseOutline } from "@/lib/aiClient"

export const Route = createFileRoute("/creator/courses/$courseId/outline")({
    beforeLoad: async () => {
        if (!isLoggedIn()) {
            throw redirect({ to: "/login" })
        }
    },
    component: OutlinePage,
})

function OutlinePage() {
    const { courseId } = Route.useParams()
    const navigate = useNavigate()
    const { courses, updateCourse, isLoading: isDataLoading } = useCreatorData()
    const course = courses.find((c) => c.id === courseId)

    const [objectives, setObjectives] = useState<string[]>([])
    const [modules, setModules] = useState<{ title: string, description: string }[]>([])
    const [isAiLoading, setIsAiLoading] = useState(false)

    // Initialize state from course data once loaded
    useEffect(() => {
        if (course) {
            if (course.learningObjectives) setObjectives([...course.learningObjectives])
            if (course.modules) {
                setModules(course.modules.map(m => ({ title: m.title, description: m.description || "" })))
            }
        }
    }, [course])

    const handleRegenerate = async () => {
        if (!course) return
        setIsAiLoading(true)
        try {
            const result = await generateCourseOutline({
                title: course.title,
                shortDescription: course.shortDescription || undefined,
                targetAudience: course.targetAudience || undefined,
                level: course.level || undefined,
                contentStyle: course.contentStyle || undefined
            })
            setObjectives(result.learningObjectives || [])
            setModules(result.modules || [])
        } catch (e) {
            console.error("AI Error", e)
        } finally {
            setIsAiLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!course) return
        await updateCourse({
            id: course.id,
            learningObjectives: objectives,
            modules: modules.map((m) => ({
                title: m.title,
                description: m.description
            }))
        })
        navigate({ to: "/creator" })
    }

    if (isDataLoading || !course) return <Spinner />

    return (
        <CreatorLayoutShell course={course} currentStep="Outline">
            <VStack align="stretch" gap={6} pb={20}>
                <Flex justify="space-between" align="center">
                    <Heading size="lg">Course Outline</Heading>
                    <Button onClick={handleRegenerate} loading={isAiLoading} variant="outline" colorPalette="purple">
                        <Icon as={FaMagic} mr={2} /> Regenerate with AI
                    </Button>
                </Flex>

                <Card.Root>
                    <Card.Header><Heading size="md">Learning Objectives</Heading></Card.Header>
                    <Card.Body>
                        <VStack align="stretch">
                            {objectives.map((obj, i) => (
                                <HStack key={i}>
                                    <Input value={obj} onChange={(e) => {
                                        const newObjs = [...objectives]
                                        newObjs[i] = e.target.value
                                        setObjectives(newObjs)
                                    }} />
                                    <IconButton aria-label="Delete" size="sm" colorPalette="red" variant="ghost" onClick={() => {
                                        setObjectives(objectives.filter((_, idx) => idx !== i))
                                    }}>
                                        <FaTrash />
                                    </IconButton>
                                </HStack>
                            ))}
                            <Button size="sm" variant="ghost" onClick={() => setObjectives([...objectives, ""])}>+ Add Objective</Button>
                        </VStack>
                    </Card.Body>
                </Card.Root>

                <Card.Root>
                    <Card.Header><Heading size="md">Modules</Heading></Card.Header>
                    <Card.Body>
                        <VStack align="stretch" gap={4}>
                            {modules.map((mod, i) => (
                                <Box key={i} borderWidth="1px" borderRadius="md" p={4}>
                                    <VStack align="stretch">
                                        <HStack justify="space-between">
                                            <Text fontWeight="bold" color="gray.500">Module {i + 1}</Text>
                                            <IconButton aria-label="Delete" size="xs" colorPalette="red" variant="ghost" onClick={() => {
                                                setModules(modules.filter((_, idx) => idx !== i))
                                            }}>
                                                <FaTrash />
                                            </IconButton>
                                        </HStack>
                                        <Input placeholder="Module Title" value={mod.title} onChange={(e) => {
                                            const newMods = [...modules]
                                            newMods[i].title = e.target.value
                                            setModules(newMods)
                                        }} fontWeight="semibold" />
                                        <Textarea placeholder="Module Description" value={mod.description} onChange={(e) => {
                                            const newMods = [...modules]
                                            newMods[i].description = e.target.value
                                            setModules(newMods)
                                        }} />
                                    </VStack>
                                </Box>
                            ))}
                            <Button onClick={() => setModules([...modules, { title: "", description: "" }])}>
                                <Icon as={FaPlus} mr={2} /> Add Module
                            </Button>
                        </VStack>
                    </Card.Body>
                </Card.Root>

                <Flex justify="flex-end">
                    <Button size="lg" colorPalette="purple" onClick={handleConfirm}>
                        Confirm Outline & Continue
                    </Button>
                </Flex>
            </VStack>
        </CreatorLayoutShell>
    )
}
