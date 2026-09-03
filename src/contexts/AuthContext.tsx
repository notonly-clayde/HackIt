import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import AuthService from "../services/AuthService"
import UserService from "../services/UserService"
import { getAuthJwt } from "../utils/auth"
import type { User } from "@neondatabase/neon-js/auth/types"
import type { UserProfile } from "../types/api"
import { useToastOptional } from "./ToastContext"
import { isAdminEmail } from "../lib/adminEmails"

const AuthContext = createContext<{
  user: User | null
  profile: UserProfile | null
  token: string | null
  otp: string | null
  suspendedMessage: string | null
  setVerificationCode: (otp: string | null) => void
  setAuth: (data: User | undefined) => void
  setProfile: (profile: UserProfile | null) => void
  isLoading: boolean
  refresh: () => Promise<void>
}>({
  user: null,
  profile: null,
  token: null,
  otp: "",
  suspendedMessage: null,
  setVerificationCode: () => {},
  setAuth: () => {},
  setProfile: () => {},
  isLoading: true,
  refresh: async () => {},
})

export const useAuth = () => useContext(AuthContext)

function isSuspendedError(message: string | undefined) {
  return Boolean(message && message.toLowerCase().includes("account suspended"))
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [suspendedMessage, setSuspendedMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [otp, setOtp] = useState<string | null>(null)
  const toast = useToastOptional()

  const fetchAuthUser = useCallback(async () => {
    setLoading(true)
    setSuspendedMessage(null)

    const [data, err] = await AuthService.getAuthUser()

    if (err) {
      toast.error(err)
    }

    if (!data) {
      setUser(null)
      setToken(null)
      setProfile(null)
      setLoading(false)
      return
    }

    const jwt = await getAuthJwt()
    setToken(jwt)
    setUser(data.user)

    if (jwt) {
      const neonVerified = data.user.emailVerified === true
      const [bootstrapped, bootstrapErr] = await UserService.bootstrap(jwt, neonVerified)
      if (bootstrapped) {
        setProfile(bootstrapped)
      } else if (bootstrapErr) {
        if (isSuspendedError(bootstrapErr)) {
          setProfile(null)
          setSuspendedMessage(bootstrapErr)
        } else if (!isAdminEmail(data.user.email)) {
          toast.error(bootstrapErr)
        }
      }
    }

    setLoading(false)
  }, [toast])

  const setAuth = (data: User | undefined) => {
    setUser(data ?? null)
    if (!data) {
      setSuspendedMessage(null)
    }
  }

  const setVerificationCode = (otp: string | null) => {
    setOtp(otp)
  }

  useEffect(() => {
    fetchAuthUser()
  }, [fetchAuthUser])

  useEffect(() => {
    if (!user) return

    const refreshToken = async () => {
      const jwt = await getAuthJwt(true)
      setToken(jwt)
    }

    const interval = window.setInterval(refreshToken, 10 * 60 * 1000)
    window.addEventListener("focus", refreshToken)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshToken)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        otp,
        suspendedMessage,
        setVerificationCode,
        setAuth,
        setProfile,
        isLoading: loading,
        refresh: fetchAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
