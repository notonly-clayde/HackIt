import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import { useAuth } from "../contexts/AuthContext"
import AuthService from "../services/AuthService"

const SuspendedAccount = () => {
  const { suspendedMessage, refresh, setAuth, setProfile } = useAuth()

  const handleSignOut = async () => {
    await AuthService.signout()
    setAuth(undefined)
    setProfile(null)
    await refresh()
  }

  return (
    <div className="page-bg flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <p className="ui-kicker mb-2">Access blocked</p>
        <h1 className="text-2xl font-bold tracking-tight text-accent">Account suspended</h1>
        <p className="mt-3 text-sm text-muted">
          {suspendedMessage ?? "Your account has been suspended by a platform admin."}
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={() => void handleSignOut()}>
          Sign out
        </Button>
      </Card>
    </div>
  )
}

export default SuspendedAccount
