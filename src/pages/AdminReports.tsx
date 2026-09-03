import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import Modal from "../components/ui/Modal"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import { TextAreaField } from "../components/ui/Field"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import { unwrap } from "../lib/unwrap"
import { STALE_TIME } from "../lib/queryClient"
import AdminService from "../services/AdminService"
import type { ReportItem } from "../types/api"

const AdminReports = () => {
  const { token } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: queryKeys.admin.reports("open"),
    queryFn: async () => unwrap(await AdminService.listReports(token, "open")),
    enabled: Boolean(token),
    staleTime: STALE_TIME.catalog,
  })
  useQueryErrorToast(error)

  const [selected, setSelected] = useState<ReportItem | null>(null)
  const [note, setNote] = useState("")
  const [suspendToo, setSuspendToo] = useState(false)
  const [suspendReason, setSuspendReason] = useState("")
  const [busy, setBusy] = useState(false)

  const resolve = async (resolution: "resolved" | "dismissed") => {
    if (!selected) return
    if (suspendToo && selected.targetType === "user" && !suspendReason.trim()) {
      toast.error("Suspend reason is required")
      return
    }
    setBusy(true)
    const [, err] = await AdminService.resolveReport(token, selected.id, {
      resolution,
      note: note.trim() || undefined,
      suspendUser: suspendToo && selected.targetType === "user",
      suspendReason: suspendReason.trim() || undefined,
    })
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success(resolution === "resolved" ? "Report resolved" : "Report dismissed")
    setSelected(null)
    setNote("")
    setSuspendToo(false)
    setSuspendReason("")
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports("open") })
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.reportCount() })
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">Open platform abuse reports.</p>
      {isLoading && reports.length === 0 ? (
        <QueryLoadingCard message="Loading reports…" />
      ) : error ? (
        <EmptyState title="Could not load reports" description={error.message} />
      ) : reports.length === 0 ? (
        <EmptyState title="No open reports" description="New reports will appear here." />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warn">{report.category}</Badge>
                    <Badge tone="neutral">{report.targetType}</Badge>
                    <span className="text-xs text-muted">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-accent line-clamp-2">{report.details}</p>
                  <p className="mt-1 text-xs text-muted">
                    By {report.reporterDisplayName} · target {report.targetId.slice(0, 8)}…
                    {report.targetType === "user" ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link to={`/u/${report.targetId}`} className="text-highlight hover:underline">
                          View profile
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelected(report)
                    setNote("")
                    setSuspendToo(false)
                    setSuspendReason("")
                  }}
                >
                  Review
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          if (!busy) setSelected(null)
        }}
        title="Resolve report"
        description={selected?.details}
        kicker="Moderation"
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => void resolve("dismissed")}>
              Dismiss
            </Button>
            <Button variant="primary" loading={busy} onClick={() => void resolve("resolved")}>
              Resolve
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Category: {selected.category} · Target: {selected.targetType}
            </p>
            <TextAreaField
              label="Resolution note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
            {selected.targetType === "user" && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <label className="flex items-center gap-2 text-sm text-accent">
                  <input
                    type="checkbox"
                    checked={suspendToo}
                    onChange={(e) => setSuspendToo(e.target.checked)}
                  />
                  Also suspend reported user
                </label>
                {suspendToo && (
                  <TextAreaField
                    label="Suspend reason"
                    rows={2}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    maxLength={500}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminReports
