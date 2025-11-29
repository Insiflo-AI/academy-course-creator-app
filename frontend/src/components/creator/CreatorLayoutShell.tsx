// @ts-nocheck
import { Box, Flex } from "@chakra-ui/react"
import { type PropsWithChildren } from "react"

import type { Course } from "@/types/course"

import { ProgressSidebar } from "./ProgressSidebar"
import { TopStepper } from "./TopStepper"

interface CreatorLayoutProps extends PropsWithChildren {
  course: Course
  currentStep: string
}

export function CreatorLayoutShell({ children, course, currentStep }: CreatorLayoutProps) {
  return (
    <Flex h="100%" minH="80vh" bg="white" borderRadius="md" shadow="sm" overflow="hidden">
      <ProgressSidebar course={course} />
      <Box flex="1" p={6} overflowY="auto">
        <TopStepper currentStep={currentStep} />
        <Box>{children}</Box>
      </Box>
    </Flex>
  )
}
