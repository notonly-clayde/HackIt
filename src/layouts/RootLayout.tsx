import { matchPath, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import AppShell from "../components/ui/AppShell"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import SuspendedAccount from "../pages/SuspendedAccount"

/** Routes that use a full-bleed editor/arena and should hide the shared nav. */
const FULL_BLEED_ROUTES = [
  "/versus/play/:matchId",
  "/versus/lobby/:matchId",
  "/tournament/:id/play",
  "/problems/:id",
] as const

function isFullBleedPath(pathname: string) {
  return FULL_BLEED_ROUTES.some((pattern) => {
    const match = matchPath({ path: pattern, end: true }, pathname)
    if (!match) return false

    // /problems/:id is practice only — not mine, new, or other static segments.
    if (pattern === "/problems/:id") {
      const id = match.params.id
      return Boolean(id && id !== "mine" && id !== "new")
    }

    return true
  })
}

const RootLayout = () => {
  const { user, isLoading, suspendedMessage } = useAuth()
  const { pathname } = useLocation()
  const fullBleed = isFullBleedPath(pathname)

  if (isLoading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center px-4">
        <QueryLoadingCard />
      </div>
    )
  }

  if (suspendedMessage) {
    return <SuspendedAccount />
  }

  if (!user) {
    return <Outlet />
  }

  return (
    <AppShell hideNav={fullBleed}>
      <Outlet />
    </AppShell>
  )
}

export default RootLayout
