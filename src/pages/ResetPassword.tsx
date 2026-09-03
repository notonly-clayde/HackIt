import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import InputGroup from "../components/common/InputGroup"
import { z } from "zod"
import AuthService from "../services/AuthService"
import Button from "../components/common/Button"
import { IoIosArrowRoundBack } from "react-icons/io"
import { Navigate, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password cannot exceed 100 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const ResetPassword = () => {
  const { user, refresh, otp, setVerificationCode } = useAuth()
  const toast = useToast()
  const { register, handleSubmit, formState, reset } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
  })
  const { errors, isDirty, isValid, isSubmitting, isSubmitSuccessful } = formState
  const nav = useNavigate()

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async ({ password }) => {
    if (!otp) return
    const [, err] = await AuthService.resetPassword({ email: user?.email as string, otp, password })
    if (err) {
      toast.error(err)
      return
    }
    setVerificationCode(null)
    refresh()
  }

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      refresh()
    }
  }, [isSubmitSuccessful, reset])

  if (!otp) return <Navigate to="/login" />

  return (
    <div className="min-h-screen page-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="ui-card w-full max-w-md p-6 sm:p-8 flex flex-col gap-5">
        <div className="text-center">
          <p className="ui-kicker mb-2">Security</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Set a new password</h1>
          <p className="text-sm text-muted mt-3">Choose a strong password for your HackIT account.</p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <InputGroup
            type="password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />
          <InputGroup
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" className="w-full" disabled={!isDirty || !isValid} loading={isSubmitting}>
            Update password
          </Button>
        </form>

        <button
          type="button"
          className="flex gap-1 items-center justify-center text-sm text-muted hover:text-highlight"
          onClick={() => nav(-1)}
        >
          <IoIosArrowRoundBack size={22} />
          Back
        </button>
      </div>
    </div>
  )
}

export default ResetPassword
