import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Badge from "../ui/Badge"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { useConfirm } from "../../contexts/ConfirmContext"
import { useToast } from "../../contexts/ToastContext"
import TournamentService from "../../services/TournamentService"
import { queryKeys } from "../../lib/queryKeys"
import type { TournamentDiscipline, TournamentSuspensionRequest } from "../../types/api"

type DisciplinePanelProps = {
  tournamentId: string
  token: string | null
  isHost: boolean
  canDecide: boolean
  discipline: TournamentDiscipline | undefined
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString()

const statusBadge = (status: TournamentSuspensionRequest["status"]) => {
  if (status === "approved") return <Badge tone="danger">Disqualified</Badge>
  if (status === "rejected") return <Badge tone="neutral">Rejected</Badge>
  return <Badge tone="warn">Pending</Badge>
}

const DisciplinePanel = ({ tournamentId, token, isHost, canDecide, discipline }: DisciplinePanelProps) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [deciding, setDeciding] = useState<string | null>(null)

  const warnings = discipline?.warnings ?? []
  const requests = discipline?.suspensionRequests ?? []
  const pending = requests.filter((request) => request.status === "pending")
  const resolved = requests.filter((request) => request.status !== "pending")

  const decide = async (request: TournamentSuspensionRequest, decision: "approve" | "reject") => {
    if (decision === "approve") {
      const ok = await confirm({
        title: "Approve suspension",
        message: `Disqualify ${request.playerDisplayName}? This cannot be undone.`,
        confirmLabel: "Disqualify",
        variant: "danger",
      })
      if (!ok) return
    }

    setDeciding(request.id)
    const [, err] = await TournamentService.decideSuspension(token, tournamentId, request.id, decision)
    setDeciding(null)

    if (err) {
      toast.error(err)
      return
    }

    toast.success(
      decision === "approve"
        ? `${request.playerDisplayName} was disqualified`
        : `Request for ${request.playerDisplayName} rejected`,
    )
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.discipline(tournamentId) })
    if (decision === "approve") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.standings(tournamentId) })
    }
  }

  return (
    <Card className="mt-5 p-5 sm:p-6">
      <p className="ui-kicker mb-4">Discipline</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h3 className="text-sm font-semibold text-accent mb-2">
            Suspension requests {pending.length > 0 && <span className="text-amber-300">({pending.length} pending)</span>}
          </h3>
          {requests.length === 0 ? (
            <p className="text-sm text-muted">No suspension requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...pending, ...resolved].map((request) => (
                <li key={request.id} className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge(request.status)}
                    <span className="text-accent font-medium">{request.playerDisplayName}</span>
                    <span className="text-muted text-xs tabular-nums ml-auto">{formatTime(request.createdAt)}</span>
                  </div>
                  <p className="text-muted mt-1.5 break-words">{request.reason}</p>
                  <p className="text-xs text-midtone mt-1">
                    {request.requestedById === request.decidedById
                      ? `Disqualified directly by ${request.requestedByDisplayName}`
                      : `Requested by ${request.requestedByDisplayName}`}
                    {request.status !== "pending" &&
                      request.requestedById !== request.decidedById &&
                      request.decidedByDisplayName &&
                      ` · decided by ${request.decidedByDisplayName}`}
                  </p>
                  {request.decisionNote && (
                    <p className="text-xs text-midtone mt-1">Note: {request.decisionNote}</p>
                  )}
                  {isHost && canDecide && request.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="danger"
                        className="!py-1.5 !px-3 text-sm"
                        disabled={deciding !== null}
                        onClick={() => void decide(request, "approve")}
                      >
                        {deciding === request.id ? "Saving…" : "Approve"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="!py-1.5 !px-3 text-sm"
                        disabled={deciding !== null}
                        onClick={() => void decide(request, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-accent mb-2">Warnings ({warnings.length})</h3>
          {warnings.length === 0 ? (
            <p className="text-sm text-muted">No warnings issued yet.</p>
          ) : (
            <ul className="space-y-3">
              {warnings.map((warning) => (
                <li key={warning.id} className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-accent font-medium">{warning.playerDisplayName}</span>
                    <span className="text-muted text-xs tabular-nums ml-auto">{formatTime(warning.createdAt)}</span>
                  </div>
                  <p className="text-muted mt-1.5 break-words">{warning.reason}</p>
                  <p className="text-xs text-midtone mt-1">Warned by {warning.issuedByDisplayName}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Card>
  )
}

export default DisciplinePanel
