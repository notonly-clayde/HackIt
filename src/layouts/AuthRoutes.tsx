import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { isEmailVerifiedForAccess } from "../lib/emailVerification"

const AuthRoutes = () => {
  const { user, profile, isLoading } = useAuth()

  if (!user && !isLoading) return <Navigate to={"/login"} replace />
  if (user && isEmailVerifiedForAccess(user, profile)) return <Navigate to={"/"} replace />

  return <Outlet />
}

export default AuthRoutes
