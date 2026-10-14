import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import AuthService from "../services/AuthService"
import OTPInput from "../components/common/OTPInput"
import Button from "../components/common/Button"
import { useNavigate } from "react-router-dom"
import { IoIosArrowRoundBack } from "react-icons/io"

const VerifyResetPassword = () => {
  const { user, setVerificationCode } = useAuth()
  const toast = useToast()
  const [resendCountdown, setResendCountdown] = useState(60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [resent, setResent] = useState(false)
  const [otp, setOtp] = useState("")
  const nav = useNavigate()

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const [, err] = await AuthService.verifyResetPassword({ email: user?.email as string, otp })
    setIsSubmitting(false)
    if (err) {
      toast.error(err)
      setInvalid(true)
      return
    }
    setVerificationCode(otp)
    nav("/reset-password")
  }

  const handleResend = async () => {
    setOtp("")
    setInvalid(false)
    setResent(true)
    await AuthService.requestResetPassword({ email: user?.email as string })
    setResendCountdown(60)
    setResent(false)
    toast.info("Reset code resent")
  }

  useEffect(() => {
    if (resendCountdown <= 0) return
    const interval = setInterval(() => setResendCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [resendCountdown])

  return (
    <div className="min-h-screen page-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="ui-card w-full max-w-md p-6 sm:p-8 flex flex-col items-center">
        <div className="text-center">
          <p className="ui-kicker mb-2">Password reset</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Check your email</h1>
          <p className="text-sm text-muted mt-3">Enter the six-digit code we sent to</p>
          <p className="text-sm font-semibold text-accent break-all mt-1">{user?.email}</p>
        </div>

        <form className="w-full" onSubmit={handleSubmit}>
          <OTPInput
            value={otp}
            onChange={setOtp}
            invalid={invalid}
            onClearInvalid={() => setInvalid(false)}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={otp.length != 6 || isSubmitting || invalid}
            loading={isSubmitting}
          >
            Verify
          </Button>
        </form>

        <p className="text-sm text-muted py-4 text-center">
          Didn&apos;t get the email?{" "}
          {resendCountdown > 0 ? (
            <strong className="text-accent">Resend in {resendCountdown}s</strong>
          ) : (
            <button type="button" className="font-bold text-highlight hover:underline cursor-pointer" onClick={handleResend}>
              {resent ? "Sent" : "Resend"}
            </button>
          )}
        </p>
        <button
          type="button"
          className="flex gap-1 items-center text-sm text-muted hover:text-highlight"
          onClick={() => nav(-1)}
        >
          <IoIosArrowRoundBack size={22} />
          Back
        </button>
      </div>
    </div>
  )
}

export default VerifyResetPassword
