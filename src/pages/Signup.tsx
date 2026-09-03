import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IoArrowBackOutline } from "react-icons/io5"
import { FaCheck } from "react-icons/fa6"
import { Link } from "react-router-dom"

import { signupSchema, type SignupFormValues } from "../types/common/signupSchema"
import OAuthProviders from "../components/common/OAuthProviders"
import InputGroup from "../components/common/InputGroup"
import AuthService from "../services/AuthService"
import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/common/Button"
import AuthPanel from "../components/common/AuthPanel"

const Signup = () => {
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false)
  const { refresh, setAuth } = useAuth()
  const toast = useToast()
  const { register, handleSubmit, formState, reset } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
  })
  const { errors, isDirty, isValid, isSubmitting, isSubmitSuccessful } = formState

  const onSubmit: SubmitHandler<SignupFormValues> = async ({ name, email, password }) => {
    const [data, err] = await AuthService.signup({ name, email, password })

    if (!data && err) {
      toast.error(err.startsWith("User already exists.") ? "User already exists." : err)
      return
    }

    setAuth(data?.user)
  }

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      refresh()
    }
  }, [isSubmitSuccessful, reset])

  return (
    <div className="auth-shell">
      <div className="auth-form-side auth-form-container">
        <Link to="/" className="mb-2 text-muted text-sm flex items-center hover:text-highlight transition-colors w-fit">
          <IoArrowBackOutline className="mr-2" />
          Back to Home
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-left text-accent tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted mb-3">Join tournaments and climb the ranks.</p>

        <OAuthProviders />

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-muted bg-surface">OR</span>
          </div>
        </div>

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit(onSubmit)}>
          <InputGroup type="text" label="Name" placeholder="Enter your name" error={errors.name?.message} {...register("name")} />
          <InputGroup type="email" label="Email" placeholder="Enter your email" error={errors.email?.message} {...register("email")} />
          <InputGroup type="password" label="Password" placeholder="Enter your password" error={errors.password?.message} {...register("password")} />
          <InputGroup
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <label className="text-xs flex gap-2 items-start text-muted">
            <input
              className="peer"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              hidden
            />
            <div className="border w-3.5 aspect-square rounded-sm border-border flex justify-center items-center cursor-pointer shrink-0 mt-0.5 peer-checked:bg-highlight peer-checked:border-highlight">
              {acceptedTerms && <FaCheck color="#091413" size={8} />}
            </div>
            <p>
              I agree to the{" "}
              <Link to="/terms" className="font-semibold text-highlight hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-semibold text-highlight hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </label>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty || !isValid || !acceptedTerms}
            className="w-full mt-1"
          >
            Sign up
          </Button>
        </form>
        <p className="text-xs text-center pt-2 text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-highlight hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      <AuthPanel variant="signup" />
    </div>
  )
}

export default Signup
