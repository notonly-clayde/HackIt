import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { TextAreaField } from "../ui/Field"
import { useConfirm } from "../../contexts/ConfirmContext"
import { useToast } from "../../contexts/ToastContext"
import TournamentService from "../../services/TournamentService"
import { queryKeys } from "../../lib/queryKeys"

type DisciplineAction = "warn" | "suspend" | "disqualify"

type PlayerDisciplineActionsProps = {
  tournamentId: string
  token: string | null
  staffRole: "host" | "mod"
  player: { userId: string; displayName: string; disqualified: boolean }
}

const actionCopy: Record<DisciplineAction, { title: string; description: string; submit: string }> = {
  warn: {
    title: "Warn player",
    description: "The player sees this warning in the arena. The host and moderators can review it later.",
    submit: "Send warning",
  },
  suspend: {
    title: "Request suspension",
    description: "The host decides whether to disqualify this player.",
    submit: "Send request",
  },
  disqualify: {
    title: "Disqualify player",
    description: "The player is removed from the arena and can no longer submit. They stay on the leaderboard marked DQ.",
    submit: "Disqualify",
  },
}

const PlayerDisciplineActions = ({ tournamentId, token, staffRole, player }: PlayerDisciplineActionsProps) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [action, setAction] = useState<DisciplineAction | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const open = (next: DisciplineAction) => {
    setReason("")
    setAction(next)
  }

  const close = () => {
    if (submitting) return
    setAction(null)
  }

  const submit = async () => {
    if (!action) return
    const trimmed = reason.trim()
    if (!trimmed) return

    if (action === "disqualify") {
      const ok = await confirm({
        title: "Disqualify player",
        message: `Disqualify ${player.displayName}? This cannot be undone.`,
        confirmLabel: "Disqualify",
        variant: "danger",
      })
      if (!ok) return
    }

    setSubmitting(true)
    const [, err] =
      action === "warn"
        ? await TournamentService.warnPlayer(token, tournamentId, player.userId, trimmed)
        : action === "suspend"
          ? await TournamentService.requestSuspension(token, tournamentId, player.userId, trimmed)
          : await TournamentService.disqualifyPlayer(token, tournamentId, player.userId, trimmed)
    setSubmitting(false)

    if (err) {
      toast.error(err)
      return
    }

    toast.success(
      action === "warn"
        ? `Warning sent to ${player.displayName}`
        : action === "suspend"
          ? "Suspension request sent to the host"
          : `${player.displayName} was disqualified`,
    )
    setAction(null)
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.discipline(tournamentId) })
    if (action === "disqualify") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.standings(tournamentId) })
    }
  }

  if (player.disqualified) {
    return <p className="text-sm text-danger">{player.displayName} is disqualified.</p>
  }

  const copy = action ? actionCopy[action] : null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="!py-1.5 !px-3 text-sm" onClick={() => open("warn")}>
          Warn
        </Button>
        {staffRole === "mod" ? (
          <Button variant="danger" className="!py-1.5 !px-3 text-sm" onClick={() => open("suspend")}>
            Request suspension
          </Button>
        ) : (
          <Button variant="danger" className="!py-1.5 !px-3 text-sm" onClick={() => open("disqualify")}>
            Disqualify
          </Button>
        )}
      </div>

      <Modal
        open={action !== null}
        onClose={close}
        kicker="Discipline"
        title={copy ? `${copy.title}: ${player.displayName}` : ""}
        description={copy?.description}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={action === "warn" ? "primary" : "danger"}
              onClick={() => void submit()}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? "Sending…" : copy?.submit}
            </Button>
          </>
        }
      >
        <TextAreaField
          label="Reason"
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe what you observed"
          autoFocus
        />
      </Modal>
    </>
  )
}

export default PlayerDisciplineActions
