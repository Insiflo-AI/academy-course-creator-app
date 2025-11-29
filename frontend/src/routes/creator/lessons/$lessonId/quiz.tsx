/// <reference types="vite/client" />
// @ts-nocheck
import { Box, Button, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { useState } from "react"

import { CreatorLayoutShell } from "@/components/creator/CreatorLayoutShell"
import { generateLessonQuiz } from "@/lib/aiClient"
import { useCreatorData } from "@/hooks/useCreatorData"
import type { Course, Lesson, QuizQuestion } from "@/types/course"

export const Route = createFileRoute("/creator/lessons/$lessonId/quiz")({
  component: LessonQuizPage,
})

function LessonQuizPage() {
  const { lessonId } = useParams({ from: "/creator/lessons/$lessonId/quiz" })
  const { courses, saveQuiz } = useCreatorData()
  const course = courses.find((c) => c.modules.some((m) => m.lessons.some((l) => l.id === lessonId))) as Course
  const module = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId))!
  const lesson = module.lessons.find((l) => l.id === lessonId) as Lesson
  const [questions, setQuestions] = useState<QuizQuestion[]>(lesson.quiz)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    const response = await generateLessonQuiz({
      lesson_title: lesson.title,
      lesson_content: lesson.content,
    })
    setQuestions(response.questions)
    setLoading(false)
  }

  const handleConfirm = () => {
    saveQuiz(lessonId, questions)
  }

  return (
    <CreatorLayoutShell course={course} currentStep="Quizzes">
      <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
        <VStack align="stretch" gap={4}>
          {questions.map((question, index) => (
            <Box key={index} borderWidth="1px" borderRadius="md" p={3}>
              <Text fontWeight="semibold">Question</Text>
              <Textarea
                value={question.questionText}
                onChange={(e) =>
                  setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, questionText: e.target.value } : q)))
                }
              />
              {question.options.map((option, optIndex) => (
                <Box key={optIndex} mt={2}>
                  <Text fontWeight="semibold">Option {optIndex + 1}</Text>
                  <Input
                    value={option}
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev.map((q, i) =>
                          i === index
                            ? {
                                ...q,
                                options: q.options.map((o, oi) => (oi === optIndex ? e.target.value : o)),
                              }
                            : q,
                        ),
                      )
                    }
                  />
                </Box>
              ))}
              <Box mt={2}>
                <Text fontWeight="semibold">Correct answer</Text>
                <Input
                  value={question.correctAnswer}
                  onChange={(e) =>
                    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, correctAnswer: e.target.value } : q)))
                  }
                />
              </Box>
              <Box mt={2}>
                <Text fontWeight="semibold">Explanation</Text>
                <Textarea
                  value={question.explanation}
                  onChange={(e) =>
                    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, explanation: e.target.value } : q)))
                  }
                />
              </Box>
            </Box>
          ))}
          <Button onClick={() => setQuestions((prev) => [...prev, { questionText: "New question", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "" }])}>
            Add question
          </Button>
          <VStack align="stretch" gap={3}>
            <Button variant="outline" onClick={handleGenerate} loading={loading}>
              Generate quiz with AI
            </Button>
            <Button colorPalette="purple" onClick={handleConfirm}>
              Confirm quiz
            </Button>
          </VStack>
        </VStack>
      </Box>
    </CreatorLayoutShell>
  )
}
