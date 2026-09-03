import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IoArrowBackOutline } from "react-icons/io5"
import { Link, useNavigate } from "react-router-dom"

import { signinSchema, type SigninFormValues } from "../types/common/signinSchema"
import OAuthProviders from "../components/common/OAuthProviders"
import InputGroup from "../components/common/InputGroup"
import AuthService from "../services/AuthService"
import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/common/Button"
import AuthPanel from "../components/common/AuthPanel"
import { FaCheck } from "react-icons/fa6"
import { isAdminEmail } from "../lib/adminEmails"

const Login = () => {
  const [rememberAccount, setRememberAccount] = useState<boolean>(false)
  const { refresh, setAuth } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { register, handleSubmit, formState, reset } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
  })
  const { errors, isDirty, isValid, isSubmitting, isSubmitSuccessful } = formState

  const onSubmit: SubmitHandler<SigninFormValues> = async ({ email, password }) => {
    const [data, err] = await AuthService.signin({ email, password })

    if (!data && err) {
      toast.error(err.startsWith("User already exists.") ? "User already exists." : err)

      if (err == "Email verification required") {
        if (isAdminEmail(email)) {
          toast.error(
            "Admin account exists but Neon still requires verification. Run `npm run db:verify-admins` on the server, then sign in again.",
          )
          return
        }

        navigate("/verify-email", { replace: true, state: { email } })
        await AuthService.resendVerifyEmailOTP({ email })
      }

      return
    }

    setAuth(data?.user)
  }

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      refresh()
    }
  }, [isSubmitSuccessful, reset, refresh])

  return (
    <div className="auth-shell">
      <div className="auth-form-side auth-form-container">
        <Link to="/" className="mb-2 text-muted text-sm flex items-center hover:text-highlight transition-colors w-fit">
          <IoArrowBackOutline className="mr-2" />
          Back to Home
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-left text-accent tracking-tight">
          Sign in to your account
        </h1>
        <p className="text-sm text-muted mb-3">Welcome back. Jump into the arena.</p>

        <OAuthProviders mode="login" />

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-muted bg-surface">OR</span>
          </div>
        </div>

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit(onSubmit)}>
          <InputGroup
            type="email"
            label="Email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />
          <InputGroup
            type="password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs flex gap-2 items-center text-muted">
              <input
                className="peer"
                type="checkbox"
                checked={rememberAccount}
                onChange={(e) => setRememberAccount(e.target.checked)}
                hidden
              />
              <div className="border w-3.5 aspect-square rounded-sm border-border flex justify-center items-center cursor-pointer peer-checked:bg-highlight peer-checked:border-highlight">
                {rememberAccount && <FaCheck color="#091413" size={8} />}
              </div>
              <p>Remember me</p>
            </label>
            <Link to="/forgot-password" className="text-xs text-midtone hover:text-highlight transition-colors">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" loading={isSubmitting} disabled={!isDirty || !isValid} className="w-full mt-1">
            Sign in
          </Button>
        </form>
        <p className="text-xs text-center pt-2 text-muted">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-highlight hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      <AuthPanel variant="login" />
    </div>
  )
}

export default Login
