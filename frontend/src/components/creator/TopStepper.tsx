// @ts-nocheck
import { Box, Flex, Text } from "@chakra-ui/react"

const steps = ["Setup", "Outline", "Lessons", "Content", "Quizzes", "Publish"]

export function TopStepper({ currentStep }: { currentStep: string }) {
  return (
    <Flex gap={3} mb={4} wrap="wrap">
      {steps.map((step) => (
        <Box
          key={step}
          px={3}
          py={1}
          borderWidth="1px"
          borderRadius="full"
          bg={step === currentStep ? "purple.50" : "white"}
          borderColor={step === currentStep ? "purple.500" : "gray.300"}
        >
          <Text fontWeight={step === currentStep ? "bold" : "normal"}>{step}</Text>
        </Box>
      ))}
    </Flex>
  )
}
