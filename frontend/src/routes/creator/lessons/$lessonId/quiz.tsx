import { Box, Button, Input, Text, Textarea, VStack, Heading, Card, HStack, IconButton, Icon, Spinner, Badge } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { FaMagic, FaTrash, FaPlus, FaSave } from "react-icons/fa"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateLessonQuiz } from "@/lib/aiClient"
import { isLoggedIn } from "@/hooks/useAuth"
import { useCreatorData } from "@/hooks/useCreatorData"
import type { QuizQuestion } from "@/types/course"

export const Route = createFileRoute("/creator/lessons/$lessonId/quiz")({
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
  component: LessonQuizPage,
})

function LessonQuizPage() {
  const { lessonId } = Route.useParams()
  const { courses, saveQuiz, isLoading } = useCreatorData()
  const navigate = useNavigate()

  const course = courses.find((c) => c.modules?.some((m) => m.lessons?.some((l) => l.id === lessonId)))
  const module = course?.modules?.find((m) => m.lessons?.some((l) => l.id === lessonId))
  const lesson = module?.lessons?.find((l) => l.id === lessonId)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    if (lesson?.quiz) {
      // @ts-ignore
      setQuestions(lesson.quiz)
    }
  }, [lesson])

  const handleGenerate = async () => {
    if (!lesson) return
    setIsAiLoading(true)
    try {
      const res = await generateLessonQuiz({
        lesson_title: lesson.title,
        lesson_content: lesson.content || {}, // Pass content so AI knows what to quiz on
        num_questions: 3
      })
      setQuestions(res.questions)
    } catch (e) {
      console.error("AI Quiz Error", e)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!lesson) return
    await saveQuiz(lessonId, questions)
    // Could navigate back to course or next lesson
    navigate({ to: "/creator" })
  }

  if (isLoading || !course || !lesson) return <Spinner />

  return (
    <CreatorLayoutShell course={course} currentStep="Quiz">
      <VStack align="stretch" gap={6} maxW="4xl" mx="auto" pb={20}>
        <Box>
          <Text color="purple.600" fontSize="sm" fontWeight="bold">Lesson Quiz</Text>
          <Heading size="lg">{lesson.title}</Heading>
        </Box>

        <Flex justify="flex-end">
          <Button onClick={handleGenerate} loading={isAiLoading} variant="outline" colorPalette="purple">
            <Icon as={FaMagic} mr={2} /> Generate Quiz with AI
          </Button>
        </Flex>

        <VStack align="stretch" gap={6}>
          {questions.map((q, qIdx) => (
            <Card.Root key={qIdx}>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="gray.500">Question {qIdx + 1}</Text>
                    <IconButton size="xs" colorPalette="red" variant="ghost" aria-label="Delete" onClick={() => {
                      setQuestions(questions.filter((_, i) => i !== qIdx))
                    }}>
                      <FaTrash />
                    </IconButton>
                  </HStack>

                  <Textarea
                    value={q.questionText}
                    onChange={(e) => {
                      const newQ = [...questions]
                      newQ[qIdx].questionText = e.target.value
                      setQuestions(newQ)
                    }}
                    fontWeight="medium"
                    placeholder="Enter question text..."
                  />

                  <VStack align="stretch" pl={4} borderLeftWidth="2px" borderColor="gray.100">
                    {q.options.map((opt, oIdx) => (
                      <HStack key={oIdx}>
                        <Button
                          size="xs"
                          variant={q.correctAnswer === opt && opt !== "" ? "solid" : "outline"}
                          colorScheme={q.correctAnswer === opt && opt !== "" ? "green" : "gray"}
                          onClick={() => {
                            const newQ = [...questions]
                            newQ[qIdx].correctAnswer = opt
                            setQuestions(newQ)
                          }}
                        >
                          {q.correctAnswer === opt ? "Correct" : "Mark Correct"}
                        </Button>
                        <Input
                          size="sm"
                          value={opt}
                          onChange={(e) => {
                            const newQ = [...questions]
                            newQ[qIdx].options[oIdx] = e.target.value
                            // If this was the correct answer, update that too to keep sync
                            if (q.correctAnswer === opt) {
                              newQ[qIdx].correctAnswer = e.target.value
                            }
                            setQuestions(newQ)
                          }}
                        />
                      </HStack>
                    ))}
                  </VStack>

                  <Box bg="blue.50" p={2} borderRadius="md">
                    <Text fontSize="xs" fontWeight="bold" color="blue.700" mb={1}>Explanation:</Text>
                    <Input
                      size="sm"
                      bg="white"
                      value={q.explanation}
                      onChange={(e) => {
                        const newQ = [...questions]
                        newQ[qIdx].explanation = e.target.value
                        setQuestions(newQ)
                      }}
                    />
                  </Box>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}

          <Button variant="ghost" onClick={() => setQuestions([...questions, {
            questionText: "",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
            explanation: ""
          }])}>
            <Icon as={FaPlus} mr={2} /> Add Question
          </Button>
        </VStack>

        <Flex justify="flex-end" pt={4}>
          <Button size="lg" colorPalette="purple" onClick={handleConfirm}>
            <Icon as={FaSave} mr={2} /> Save Quiz
          </Button>
        </Flex>
      </VStack>
    </CreatorLayoutShell>
  )
}
