import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  HiOutlineArrowDownCircle,
  HiOutlineArrowUpCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
} from "react-icons/hi2"
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
import type { ModerationActionItem } from "../types/api"
import { formatRelativeTime } from "../utils/relativeTime"

const actionMeta: Record<
  ModerationActionItem["type"],
  { label: string; icon: ReactNode; tone: "warn" | "danger" | "success" | "neutral"; iconClass: string }
> = {
  warn: {
    label: "Warned",
    icon: <HiOutlineExclamationTriangle className="h-4 w-4" />,
    tone: "warn",
    iconClass: "!bg-amber-400/15 !text-amber-300",
  },
  suspend: {
    label: "Suspended",
    icon: <HiOutlineNoSymbol className="h-4 w-4" />,
    tone: "danger",
    iconClass: "!bg-danger-soft !text-danger",
  },
  unsuspend: {
    label: "Unsuspended",
    icon: <HiOutlineCheckCircle className="h-4 w-4" />,
    tone: "success",
    iconClass: "",
  },
  promote: {
    label: "Promoted to admin",
    icon: <HiOutlineArrowUpCircle className="h-4 w-4" />,
    tone: "success",
    iconClass: "",
  },
  demote: {
    label: "Demoted to user",
    icon: <HiOutlineArrowDownCircle className="h-4 w-4" />,
    tone: "neutral",
    iconClass: "!bg-secondary/40 !text-midtone",
  },
}

const ModerationTimeline = ({ history }: { history: ModerationActionItem[] }) => (
  <ol className="relative">
    {history.map((action, index) => {
      const meta = actionMeta[action.type]
      const isLast = index === history.length - 1
      return (
        <li key={action.id} className="relative flex gap-4 pb-5 last:pb-0">
          {!isLast ? (
            <span className="absolute left-[1.125rem] top-10 bottom-0 w-px bg-border" aria-hidden />
          ) : null}
          <div className={`ui-icon-box !h-9 !w-9 ${meta.iconClass}`}>{meta.icon}</div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={meta.tone}>{action.type}</Badge>
                <span className="text-sm font-semibold text-accent">{meta.label}</span>
              </div>
              <time
                dateTime={action.createdAt}
                title={new Date(action.createdAt).toLocaleString()}
                className="text-xs tabular-nums text-muted"
              >
                {formatRelativeTime(action.createdAt)}
              </time>
            </div>
            <p className="mt-1 text-xs text-muted">
              by{" "}
              <Link to={`/admin/users/${action.actorId}`} className="text-midtone hover:text-highlight hover:underline">
                {action.actorDisplayName}
              </Link>
              {" · "}
              {new Date(action.createdAt).toLocaleString()}
            </p>
            {action.note ? (
              <blockquote className="mt-2 border-l-2 border-highlight/40 bg-secondary/20 px-3 py-2 text-sm text-accent/90 whitespace-pre-wrap break-words">
                {action.note}
              </blockquote>
            ) : null}
            {action.type === "warn" ? (
              <p className="mt-2 text-xs text-muted">
                {action.acknowledgedAt
                  ? `Acknowledged ${formatRelativeTime(action.acknowledgedAt)}`
                  : "Not yet acknowledged"}
              </p>
            ) : null}
          </div>
        </li>
      )
    })}
  </ol>
)

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
  const isSuperAdmin = data.isSuperAdmin

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
            {isSuperAdmin ? <Badge tone="warn">Super admin</Badge> : null}
          </div>
          {isSuperAdmin ? (
            <p className="mt-2 text-xs text-muted">
              Super admins are configured on the server and can&apos;t be demoted or suspended.
            </p>
          ) : null}
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
              ) : isSuperAdmin ? null : (
                <Button variant="danger" disabled={busy} onClick={() => { setNote(""); setSuspendOpen(true) }}>
                  Suspend
                </Button>
              )}
              {isSuperAdmin ? null : user.role === "admin" ? (
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="ui-kicker">Moderation history</p>
          {data.history.length > 0 ? (
            <span className="text-xs tabular-nums text-muted">
              {data.history.length} action{data.history.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        {data.history.length === 0 ? (
          <p className="text-sm text-muted">No moderation actions yet.</p>
        ) : (
          <ModerationTimeline history={data.history} />
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
