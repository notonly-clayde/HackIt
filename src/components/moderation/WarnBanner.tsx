import Button from "../ui/Button"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "../../contexts/ToastContext"
import UserService from "../../services/UserService"

const WarnBanner = () => {
  const { token, profile, setProfile } = useAuth()
  const toast = useToast()
  const warn = profile?.activeWarn

  if (!warn) return null

  const acknowledge = async () => {
    const [, err] = await UserService.acknowledgeWarn(token, warn.id)
    if (err) {
      toast.error(err)
      return
    }
    if (profile) {
      setProfile({ ...profile, activeWarn: null })
    }
    toast.success("Warning acknowledged")
  }

  return (
    <div className="page-container pt-4">
      <div className="flex flex-col gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-200">Platform warning</p>
          <p className="mt-1 text-sm text-muted">
            {warn.note?.trim() || "A platform admin issued a warning on your account."}
          </p>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={() => void acknowledge()}>
          Acknowledge
        </Button>
      </div>
    </div>
  )
}

export default WarnBanner
