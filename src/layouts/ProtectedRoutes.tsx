import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import SuspendedAccount from "../pages/SuspendedAccount"
import { isEmailVerifiedForAccess } from "../lib/emailVerification"
import ModeratorInviteListener from "../components/tournament/ModeratorInviteListener"

const ProtectedRoutes = () => {
  const { user, profile, isLoading, suspendedMessage } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <QueryLoadingCard />
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />
  if (suspendedMessage) return <SuspendedAccount />
  if (!isEmailVerifiedForAccess(user, profile)) return <Navigate to="/verify-email" replace />

  return (
    <>
      <ModeratorInviteListener />
      <Outlet />
    </>
  )
}

export default ProtectedRoutes
