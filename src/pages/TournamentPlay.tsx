import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PlayArena from "../components/play/PlayArena"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import TournamentService from "../services/TournamentService"
import { reconnectLobby, watchTournament } from "../services/socket"
import { useAuth } from "../contexts/AuthContext"
import { useResumeCountdown } from "../hooks/useResumeCountdown"
import { useTournamentTimer } from "../hooks/useTournamentTimer"
import {
  useTournamentDetail,
  useTournamentProblems,
} from "../hooks/queries/useTournamentQueries"
import {
  problemsFromItems,
  useTournamentLiveStateSocket,
  useTournamentProblemSetSocket,
} from "../hooks/useTournamentLiveSockets"

const TournamentPlay = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
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

    if (tournament.viewerRole !== "player" && tournament.viewerRole !== "mod") {
      redirectedRef.current = true
      navigate(`/tournament/${id}/spectate`, { replace: true })
    }
  }, [tournament, id, navigate])

  useEffect(() => {
    if (!token || !id || !tournament) return

    if (wasFrozenRef.current && !contestFrozen) {
      void TournamentService.listProblems(token, id)
    }

    wasFrozenRef.current = contestFrozen
  }, [contestFrozen, token, id, tournament])

  useEffect(() => {
    if (!token || !id || !tournament) return
    if (tournament.viewerRole !== "player" && tournament.viewerRole !== "mod") return
    void reconnectLobby(token, id)
  }, [token, id, tournament])

  useEffect(() => {
    if (!token || !id) return
    return watchTournament(token, id)
  }, [token, id])

  useTournamentLiveStateSocket(token, id, () => {
    if (id) navigate(`/tournament/${id}/spectate`, { replace: true })
  })
  useTournamentProblemSetSocket(token, id)

  const loading = (tournamentLoading && !tournament) || (problemsLoading && problems.length === 0 && !frozen)

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <QueryLoadingCard message="Loading play arena…" />
      </div>
    )
  }

  return (
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
  )
}

export default TournamentPlay
