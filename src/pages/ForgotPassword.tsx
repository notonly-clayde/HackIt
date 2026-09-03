import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import InputGroup from "../components/common/InputGroup"
import { z } from "zod"
import AuthService from "../services/AuthService"
import Button from "../components/common/Button"
import { IoIosArrowRoundBack } from "react-icons/io"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
  const { setAuth } = useAuth()
  const toast = useToast()
  const { register, handleSubmit, formState, reset } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  })
  const { errors, isDirty, isValid, isSubmitting, isSubmitSuccessful } = formState
  const nav = useNavigate()

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async ({ email }) => {
    const [, err] = await AuthService.requestResetPassword({ email })

    if (err) {
      toast.error(err)
      return
    }

    setAuth({
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      email: email,
      emailVerified: false,
      name: "",
    })

    nav("/verify-reset-password")
  }

  useEffect(() => {
    if (isSubmitSuccessful) reset()
  }, [isSubmitSuccessful, reset])

  return (
    <div className="min-h-screen page-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="ui-card w-full max-w-md p-6 sm:p-8 flex flex-col gap-5">
        <div className="text-center">
          <p className="ui-kicker mb-2">Account</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Forgot password?</h1>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Enter the email associated with your account. We&apos;ll send reset instructions.
          </p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <InputGroup
            type="email"
            label="Email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" className="w-full" disabled={!isDirty || !isValid} loading={isSubmitting}>
            Send instructions
          </Button>
        </form>

        <button
          type="button"
          className="flex gap-1 items-center justify-center text-sm text-muted hover:text-highlight transition-colors"
          onClick={() => nav(-1)}
        >
          <IoIosArrowRoundBack size={22} />
          Back
        </button>
      </div>
    </div>
  )
}

export default ForgotPassword
