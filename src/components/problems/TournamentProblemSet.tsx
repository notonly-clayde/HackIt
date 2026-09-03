import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Card from "../ui/Card"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
import EmptyState from "../ui/EmptyState"
import Modal from "../ui/Modal"
import { SelectField } from "../ui/Field"
import RefreshingIndicator from "../ui/RefreshingIndicator"
import { useToast } from "../../contexts/ToastContext"
import { isTournamentMissingMessage } from "../../hooks/useTournamentRemovedRedirect"
import { useConfirm } from "../../contexts/ConfirmContext"
import TournamentService from "../../services/TournamentService"
import {
  useMyProblems,
  useProblemCatalog,
} from "../../hooks/queries/useProblemQueries"
import { useTournamentProblems } from "../../hooks/queries/useTournamentQueries"
import { queryKeys } from "../../lib/queryKeys"

type ProblemSetMode = "full" | "add-only" | "readonly"

type TournamentProblemSetProps = {
  tournamentId: string
  token: string | null
  isHost: boolean
  mode: ProblemSetMode
  hint?: string
}

const visibilityTone = {
  private: "neutral",
  pending: "warn",
  public: "live",
} as const

const TournamentProblemSet = ({
  tournamentId,
  token,
  isHost,
  mode,
  hint,
}: TournamentProblemSetProps) => {
  const queryClient = useQueryClient()
  const canAttach = mode === "full" || mode === "add-only"
  const canReorder = mode === "full"

  const {
    data: attached = [],
    isLoading,
    isFetching,
    error,
  } = useTournamentProblems(tournamentId, token, Boolean(token))

  const { data: catalog = [] } = useProblemCatalog(token, {}, isHost && canAttach)
  const { data: mine = [] } = useMyProblems(token)

  const [attachOpen, setAttachOpen] = useState(false)
  const [source, setSource] = useState<"catalog" | "mine">("catalog")
  const [selectedId, setSelectedId] = useState("")
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const { confirm } = useConfirm()

  useEffect(() => {
    if (error && !isTournamentMissingMessage(error.message)) toast.error(error.message)
  }, [error, toast])

  if (!isHost) {
    return null
  }

  const privateMine = mine.filter((p) => p.visibility !== "public")

  const available =
    source === "catalog"
      ? catalog.filter((p) => !attached.some((a) => a.problemId === p.id))
      : privateMine.filter((p) => !attached.some((a) => a.problemId === p.id))

  const invalidateProblems = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tournaments.problems(tournamentId),
    })
  }

  const handleAttach = async () => {
    if (!token || !selectedId) return
    setBusy(true)
    const [, err] = await TournamentService.attachProblem(token, tournamentId, { problemId: selectedId })
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("Problem added")
    setAttachOpen(false)
    setSelectedId("")
    invalidateProblems()
  }

  const handleDetach = async (problemId: string) => {
    if (!token) return

    const ok = await confirm({
      title: "Remove problem",
      message: "Remove this problem from the tournament?",
      confirmLabel: "Remove",
      variant: "danger",
    })
    if (!ok) return
    setBusy(true)
    const [, err] = await TournamentService.detachProblem(token, tournamentId, problemId)
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    invalidateProblems()
  }

  const move = async (index: number, direction: -1 | 1) => {
    if (!token) return
    const next = index + direction
    if (next < 0 || next >= attached.length) return

    const reordered = [...attached]
    const [item] = reordered.splice(index, 1)
    reordered.splice(next, 0, item)

    const order = reordered.map((entry, orderIndex) => ({
      problemId: entry.problemId,
      order: orderIndex,
    }))

    setBusy(true)
    const [, err] = await TournamentService.reorderProblems(token, tournamentId, order)
    setBusy(false)
    if (err) {
      toast.error(err)
      return
    }
    invalidateProblems()
  }

  const defaultHint =
    mode === "add-only"
      ? "You can add problems while the contest is paused. Players will see them when play resumes."
      : "Players see problems only after the tournament goes Live."

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="ui-kicker mb-1">Problem set</p>
          <h2 className="text-accent font-semibold tracking-tight">
            {mode === "add-only" ? "Add problems while paused" : "Host-only · not visible in lobby"}
          </h2>
          <p className="text-muted text-sm mt-1">{hint ?? defaultHint}</p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshingIndicator show={isFetching && !isLoading} />
          {canAttach && (
            <Button variant="primary" onClick={() => setAttachOpen(true)} disabled={busy}>
              Add problem
            </Button>
          )}
        </div>
      </div>

      {isLoading && attached.length === 0 ? (
        <p className="text-muted text-sm">Loading problem set…</p>
      ) : error ? (
        <EmptyState title="Could not load problems" description={error.message} />
      ) : attached.length === 0 ? (
        <EmptyState
          title="No problems attached"
          description={
            canAttach
              ? "Add at least one problem with hidden tests before starting."
              : "The host has not added problems yet."
          }
        />
      ) : (
        <ul className="space-y-2">
          {attached.map((entry, index) => (
            <li
              key={entry.problemId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-accent font-medium truncate">
                  {index + 1}. {entry.problem.title}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {entry.points} pts · {entry.problem.difficulty} · {entry.problem.author}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={visibilityTone[entry.problem.visibility]}>{entry.problem.visibility}</Badge>
                {canReorder && (
                  <>
                    <Button variant="ghost" className="!py-1 !px-2 text-xs" disabled={busy || index === 0} onClick={() => move(index, -1)}>
                      Up
                    </Button>
                    <Button
                      variant="ghost"
                      className="!py-1 !px-2 text-xs"
                      disabled={busy || index === attached.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      Down
                    </Button>
                    <Button variant="danger" className="!py-1 !px-2 text-xs" disabled={busy} onClick={() => handleDetach(entry.problemId)}>
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}


      <Modal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Add problem to tournament"
        description="Pick from the public catalog or your private library."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAttachOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAttach} disabled={!selectedId || busy}>
              Attach
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField label="Source" value={source} onChange={(e) => { setSource(e.target.value as "catalog" | "mine"); setSelectedId("") }}>
            <option value="catalog">Public catalog</option>
            <option value="mine">My problems</option>
          </SelectField>
          <SelectField label="Problem" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select a problem…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty}
                {p.tags?.length ? ` · ${p.tags.slice(0, 2).join(", ")}` : ""})
              </option>
            ))}
          </SelectField>
          {available.length === 0 && (
            <p className="text-sm text-muted">No available problems in this source.</p>
          )}
        </div>
      </Modal>
    </Card>
  )
}

export default TournamentProblemSet
