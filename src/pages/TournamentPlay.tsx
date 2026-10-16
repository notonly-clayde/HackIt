import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import PlayArena from "../components/play/PlayArena"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import TournamentService from "../services/TournamentService"
import {
  reconnectLobby,
  subscribeTournamentPlayerDisqualified,
  subscribeTournamentPlayerWarned,
  watchTournament,
} from "../services/socket"
import { useAuth } from "../contexts/AuthContext"
import { useHudSound } from "../contexts/SoundContext"
import { useToast } from "../contexts/ToastContext"
import { queryKeys } from "../lib/queryKeys"
import { HiOutlineExclamationTriangle } from "react-icons/hi2"
import { MAX_TOURNAMENT_WARNINGS, type TournamentPlayerWarnedEvent } from "../types/api"
import { useResumeCountdown } from "../hooks/useResumeCountdown"
import { useTournamentTimer } from "../hooks/useTournamentTimer"
import {
  useTournamentDetail,
  useTournamentProblems,
} from "../hooks/queries/useTournamentQueries"
import { useTournamentEndedScoreboardRedirect } from "../hooks/useTournamentEndedScoreboardRedirect"
import {
  problemsFromItems,
  useTournamentLiveStateSocket,
  useTournamentProblemSetSocket,
} from "../hooks/useTournamentLiveSockets"

const TournamentPlay = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const { play } = useHudSound()
  const queryClient = useQueryClient()
  const [warning, setWarning] = useState<TournamentPlayerWarnedEvent | null>(null)
  const wasFrozenRef = useRef(false)
  const redirectedRef = useRef(false)

  const { data: tournament, isLoading: tournamentLoading } = useTournamentDetail(id, token)

  const { contestFrozen, isResuming, secondsLeft } = useResumeCountdown({
    pausedAt: tournament?.pausedAt,
    resumeAt: tournament?.resumeAt,
    endedAt: tournament?.endedAt,
  })

  const frozen = Boolean(tournament?.pausedAt && !tournament?.endedAt)
  const { data: problemItems = [], isLoading: problemsLoading } = useTournamentProblems(
    id,
    token,
    Boolean(tournament?.status === "Live" && token && !frozen),
  )

  const problems = problemsFromItems(problemItems)

  const timerFields = {
    status: tournament?.status ?? "Open",
    durationMinutes: tournament?.durationMinutes ?? 0,
    liveStartedAt: tournament?.liveStartedAt,
    pausedAt: tournament?.pausedAt,
    resumeAt: tournament?.resumeAt,
    pausedTotalMs: tournament?.pausedTotalMs,
    endedAt: tournament?.endedAt,
  }

  const { remainingMs } = useTournamentTimer(timerFields)
  const contestTimeExpired = remainingMs === 0

  useEffect(() => {
    if (!tournament || !id || redirectedRef.current) return

    if (!tournament) {
      redirectedRef.current = true
      navigate(`/tournament/${id}/spectate`, { replace: true })
      return
    }

    if (tournament.viewerRole === "host") {
      redirectedRef.current = true
      navigate(`/tournament/${id}/spectate`, { replace: true })
      return
    }

    if (tournament.status !== "Live") {
      redirectedRef.current = true
      navigate(`/tournament/${id}`, { replace: true })
      return
    }

    if (tournament.viewerRole !== "player") {
      redirectedRef.current = true
      navigate(`/tournament/${id}/spectate`, { replace: true })
      return
    }

    if (tournament.viewerDisqualified) {
      redirectedRef.current = true
      toast.error(
        tournament.viewerDisqualifyReason
          ? `You were disqualified: ${tournament.viewerDisqualifyReason}`
          : "You were disqualified from this tournament",
      )
      navigate(`/tournament/${id}`, { replace: true })
      return
    }

    if (tournament.viewerContestFinished) {
      redirectedRef.current = true
      navigate(`/tournament/${id}`, { replace: true })
    }
  }, [tournament, id, navigate, toast])

  useEffect(() => {
    if (!token || !id || !tournament) return

    if (wasFrozenRef.current && !contestFrozen) {
      void TournamentService.listProblems(token, id)
    }

    wasFrozenRef.current = contestFrozen
  }, [contestFrozen, token, id, tournament])

  useEffect(() => {
    if (!token || !id || !tournament) return
    if (tournament.viewerRole !== "player" || tournament.viewerDisqualified) return
    void reconnectLobby(token, id)
  }, [token, id, tournament])

  useEffect(() => {
    if (!token || !id) return
    return watchTournament(token, id)
  }, [token, id])

  useEffect(() => {
    if (!token || !id) return

    const unsubscribeWarned = subscribeTournamentPlayerWarned(token, (event) => {
      if (event.tournamentId !== id) return
      play("alert")
      setWarning(event)
    })

    const unsubscribeDisqualified = subscribeTournamentPlayerDisqualified(token, (event) => {
      if (event.tournamentId !== id) return
      play("defeat")
      toast.error(`You were disqualified: ${event.reason}`)
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) })
      redirectedRef.current = true
      navigate(`/tournament/${id}/spectate`, { replace: true })
    })

    return () => {
      unsubscribeWarned()
      unsubscribeDisqualified()
    }
  }, [token, id, navigate, play, queryClient, toast])

  useTournamentEndedScoreboardRedirect(id, tournament?.status)

  useTournamentLiveStateSocket(token, id, () => {
    if (!id) return
    redirectedRef.current = true
    navigate(`/tournament/${id}`, { replace: true })
  })
  useTournamentProblemSetSocket(token, id)

  useEffect(() => {
    if (!id || !contestTimeExpired || tournament?.status !== "Live") return
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) })
  }, [id, contestTimeExpired, tournament?.status, queryClient])

  const loading = (tournamentLoading && !tournament) || (problemsLoading && problems.length === 0 && !frozen)

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <QueryLoadingCard message="Loading play arena…" />
      </div>
    )
  }

  return (
    <>
      <PlayArena
        backTo={`/tournament/${id}`}
        backLabel="Event"
        modeLabel={tournament.name}
        title={tournament.name}
        problems={problems}
        timerFields={timerFields}
        contestFrozen={contestFrozen}
        contestTimeExpired={contestTimeExpired}
        resumeCountdownSeconds={isResuming ? secondsLeft : null}
        authToken={token}
        tournamentId={id}
        focusIntegrity={{
          enabled: tournament.status === "Live" && !contestTimeExpired,
          paused: contestFrozen,
        }}
      />
      <Modal
        open={warning !== null}
        onClose={() => setWarning(null)}
        kicker="Moderator warning"
        title="You received a warning"
        description={
          warning
            ? `From ${warning.issuedBy} at ${new Date(warning.at).toLocaleTimeString()}`
            : undefined
        }
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setWarning(null)}>
            I understand
          </Button>
        }
      >
        {warning && (
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineExclamationTriangle className="h-6 w-6 shrink-0 text-amber-400" aria-hidden />
            <p className="text-sm font-semibold text-amber-300 tabular-nums">
              Warning {warning.warningCount ?? 1} of {warning.maxWarnings ?? MAX_TOURNAMENT_WARNINGS}
            </p>
          </div>
        )}
        <p className="text-sm text-accent whitespace-pre-wrap break-words">{warning?.reason}</p>
        <p className="text-xs text-muted mt-3">
          {(warning?.warningCount ?? 1) >= (warning?.maxWarnings ?? MAX_TOURNAMENT_WARNINGS)
            ? "You reached the warning limit and will be disqualified from this contest."
            : `After ${warning?.maxWarnings ?? MAX_TOURNAMENT_WARNINGS} warnings you are automatically disqualified and removed from the contest.`}
        </p>
      </Modal>
    </>
  )
}

export default TournamentPlay
