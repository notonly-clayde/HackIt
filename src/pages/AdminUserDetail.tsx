import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import Modal from "../components/ui/Modal"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import { TextAreaField } from "../components/ui/Field"
import { useAuth } from "../contexts/AuthContext"
import { useConfirm } from "../contexts/ConfirmContext"
import { useToast } from "../contexts/ToastContext"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import { unwrap } from "../lib/unwrap"
import { STALE_TIME } from "../lib/queryClient"
import AdminService from "../services/AdminService"

const AdminUserDetail = () => {
  const { id } = useParams()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.user(id ?? ""),
    queryFn: async () => unwrap(await AdminService.getUser(token, id!)),
    enabled: Boolean(token) && Boolean(id),
    staleTime: STALE_TIME.detail,
  })
  useQueryErrorToast(error)

  const [warnOpen, setWarnOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  if (profile && profile.role !== "admin") {
    return <Navigate to="/problems" replace />
  }

  if (isLoading && !data) {
    return <QueryLoadingCard message="Loading user…" />
  }

  if (error || !data) {
    return (
      <EmptyState
        title="User unavailable"
        description={error?.message}
        action={
          <Link to="/admin/users">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    )
  }

  const user = data.user
  const isSelf = profile?.id === user.id

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(user.id) })
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    void refetch()
  }

  const handleWarn = async () => {
    if (!note.trim()) {
      toast.error("Warn note is required")
      return
    }
    setBusy(true)
    const [, err] = await AdminService.warnUser(token, user.id, note.trim())
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("User warned")
    setWarnOpen(false)
    setNote("")
    invalidate()
  }

  const handleSuspend = async () => {
    if (!note.trim()) {
      toast.error("Suspend reason is required")
      return
    }
    setBusy(true)
    const [, err] = await AdminService.suspendUser(token, user.id, note.trim())
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("User suspended")
    setSuspendOpen(false)
    setNote("")
    invalidate()
  }

  const handleUnsuspend = async () => {
    const ok = await confirm({
      title: "Unsuspend user?",
      message: `${user.displayName} will regain access.`,
      confirmLabel: "Unsuspend",
    })
    if (!ok) return
    setBusy(true)
    const [, err] = await AdminService.unsuspendUser(token, user.id)
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("User unsuspended")
    invalidate()
  }

  const handleRole = async (role: "admin" | "user") => {
    const ok = await confirm({
      title: role === "admin" ? "Promote to admin?" : "Demote to user?",
      message:
        role === "admin"
          ? `${user.displayName} will get platform admin access.`
          : `${user.displayName} will lose platform admin access.`,
      confirmLabel: role === "admin" ? "Promote" : "Demote",
      variant: role === "admin" ? "primary" : "danger",
    })
    if (!ok) return
    setBusy(true)
    const [, err] = await AdminService.setUserRole(token, user.id, role)
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success(role === "admin" ? "User promoted" : "User demoted")
    invalidate()
  }

  return (
    <div>
      <Link to="/admin/users" className="text-sm text-muted hover:text-highlight">
        ← Users
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-accent">{user.displayName}</h2>
          <p className="text-sm text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={user.role === "admin" ? "live" : "neutral"}>{user.role}</Badge>
            <Badge tone={user.status === "suspended" ? "danger" : "success"}>{user.status}</Badge>
          </div>
          {user.suspendReason ? (
            <p className="mt-2 text-sm text-danger">Suspended: {user.suspendReason}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/u/${user.id}`}>
            <Button variant="ghost">Public profile</Button>
          </Link>
          {!isSelf && (
            <>
              <Button variant="secondary" disabled={busy} onClick={() => { setNote(""); setWarnOpen(true) }}>
                Warn
              </Button>
              {user.status === "suspended" ? (
                <Button variant="primary" disabled={busy} onClick={() => void handleUnsuspend()}>
                  Unsuspend
                </Button>
              ) : (
                <Button variant="danger" disabled={busy} onClick={() => { setNote(""); setSuspendOpen(true) }}>
                  Suspend
                </Button>
              )}
              {user.role === "admin" ? (
                <Button variant="danger" disabled={busy} onClick={() => void handleRole("user")}>
                  Demote
                </Button>
              ) : (
                <Button variant="primary" disabled={busy} onClick={() => void handleRole("admin")}>
                  Promote
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Card className="mt-6 p-5">
        <p className="ui-kicker mb-3">Moderation history</p>
        {data.history.length === 0 ? (
          <p className="text-sm text-muted">No actions yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.history.map((action) => (
              <li key={action.id} className="border-b border-border/60 py-2 text-sm last:border-0">
                <span className="font-medium text-accent">{action.type}</span>
                <span className="text-muted"> by {action.actorDisplayName} · {new Date(action.createdAt).toLocaleString()}</span>
                {action.note ? <p className="mt-1 text-muted">{action.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <p className="ui-kicker mb-3">Reports about this user</p>
        {data.reports.length === 0 ? (
          <p className="text-sm text-muted">No reports.</p>
        ) : (
          <ul className="space-y-2">
            {data.reports.map((report) => (
              <li key={report.id} className="border-b border-border/60 py-2 text-sm last:border-0">
                <Badge tone="warn">{report.category}</Badge>{" "}
                <Badge tone="neutral">{report.status}</Badge>
                <p className="mt-1 text-accent">{report.details}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={warnOpen}
        onClose={() => !busy && setWarnOpen(false)}
        title="Warn user"
        kicker="Moderation"
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setWarnOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={busy} onClick={() => void handleWarn()}>
              Send warn
            </Button>
          </>
        }
      >
        <TextAreaField label="Note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </Modal>

      <Modal
        open={suspendOpen}
        onClose={() => !busy && setSuspendOpen(false)}
        title="Suspend user"
        kicker="Warning"
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void handleSuspend()}>
              Suspend
            </Button>
          </>
        }
      >
        <TextAreaField label="Reason" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Modal>
    </div>
  )
}

export default AdminUserDetail
