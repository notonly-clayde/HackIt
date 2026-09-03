import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { isEmailVerifiedForAccess } from "../lib/emailVerification"

export default function GuestRoutes() {
  const { user, profile, isLoading } = useAuth()

  if (user && !isLoading && !isEmailVerifiedForAccess(user, profile)) {
    return <Navigate to="/verify-email" replace />
  }
  if (user && isEmailVerifiedForAccess(user, profile)) return <Navigate to="/" replace />

  return <Outlet />
}
