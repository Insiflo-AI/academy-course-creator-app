import { Flex } from "@chakra-ui/react"
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const location = useLocation()

  // Check if we are in the "editor" mode which needs full screen
  // Matches: /creator/courses/$id/outline, /creator/modules/..., /creator/lessons/...
  const isCreatorEditor = location.pathname.includes("/creator/courses/") && location.pathname.includes("/outline") ||
    location.pathname.includes("/creator/modules/") ||
    location.pathname.includes("/creator/lessons/")

  if (isCreatorEditor) {
    return <Outlet />
  }

  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Flex flex="1" direction="column" p={4} overflowY="auto">
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Layout
