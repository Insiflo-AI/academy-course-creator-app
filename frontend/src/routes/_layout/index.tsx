import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  return <Navigate to="/creator" />
}
