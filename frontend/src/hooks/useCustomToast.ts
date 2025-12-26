"use client"

import { useCallback } from "react"

import { toaster } from "@/components/ui/toaster"

const useCustomToast = () => {
  const showSuccessToast = useCallback((description: string) => {
    toaster.create({
      title: "Success!",
      description,
      type: "success",
    })
  }, [])

  const showErrorToast = useCallback((description: string) => {
    toaster.create({
      title: "Something went wrong!",
      description,
      type: "error",
    })
  }, [])

  return { showSuccessToast, showErrorToast } // Returns stable object refs now? 
  // Actually, returning a new object { ... } every time still breaks equality check if used in dependencies? 
  // Wait, destructuring { showSuccessToast } = useCustomToast(). 
  // refreshCourses deps: [showSuccessToast].
  // If showSuccessToast is stable, then it is fine.
}

export default useCustomToast
