import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PlayArena from "../components/play/PlayArena"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Modal from "../components/ui/Modal"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useForfeitLeaveGuard } from "../hooks/useForfeitLeaveGuard"
import { useTournamentTimer } from "../hooks/useTournamentTimer"
import VersusService from "../services/VersusService"
import {
  subscribeVersusEnded,
  subscribeVersusStarted,
  subscribeVersusState,
  watchVersusMatch,
} from "../services/socket"
import type { VersusMatch, VersusMatchEnded } from "../types/api"
import type { TournamentTimerFields } from "../types/api"

const VersusPlay = () => {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const [match, setMatch] = useState<VersusMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [ended, setEnded] = useState<VersusMatchEnded | null>(null)
  const [leaving, setLeaving] = useState(false)
  const redirectedRef = useRef(false)

  const matchActive = Boolean(match && match.status === "live" && !ended)
  const { confirmOpen, requestLeave, cancelLeave, confirmLeave } = useForfeitLeaveGuard(matchActive)

  const applyEnded = useCallback((event: VersusMatchEnded) => {
    setEnded(event)
    setMatch(event.match)
  }, [])

  useEffect(() => {
    if (!token || !matchId) return

    let cancelled = false
    setLoading(true)

    void VersusService.getMatch(token, matchId).then(([data, err]) => {
      if (cancelled) return
      if (err || !data) {
        toast.error(err ?? "Match not found")
        navigate("/versus", { replace: true })
        return
      }

      setMatch(data)
      setLoading(false)

      if (data.status === "lobby" && !redirectedRef.current) {
        redirectedRef.current = true
        navigate(`/versus/lobby/${data.id}`, { replace: true })
        return
      }

      if (data.status === "ended" || data.status === "aborted") {
        applyEnded({
          match: data,
          result:
            data.status === "aborted"
              ? "abort"
              : data.winnerId === (data.youAre === "a" ? data.playerA.id : data.playerB.id)
                ? "win"
                : data.winnerId
                  ? "loss"
                  : "draw",
          yourEloDelta:
            data.status === "aborted"
              ? 0
              : (data.youAre === "a"
                  ? (data.playerAEloAfter ?? data.playerAEloBefore)
                  : (data.playerBEloAfter ?? data.playerBEloBefore)) -
                (data.youAre === "a" ? data.playerAEloBefore : data.playerBEloBefore),
        })
      }
    })

    void watchVersusMatch(token, matchId)

    return () => {
      cancelled = true
    }
  }, [token, matchId, navigate, toast, applyEnded])

  useEffect(() => {
    if (!token || !matchId) return

    const unsubState = subscribeVersusState(token, (next) => {
      if (next.id !== matchId) return
      setMatch(next)
      if (next.status === "lobby" && !redirectedRef.current) {
        redirectedRef.current = true
        navigate(`/versus/lobby/${next.id}`, { replace: true })
      }
    })
    const unsubStarted = subscribeVersusStarted(token, (event) => {
      if (event.matchId !== matchId) return
      void VersusService.getMatch(token, matchId).then(([data]) => {
        if (data) setMatch(data)
      })
    })
    const unsubEnded = subscribeVersusEnded(token, (event) => {
      if (event.match.id !== matchId) return
      applyEnded(event)
    })

    return () => {
      unsubState()
      unsubStarted()
      unsubEnded()
    }
  }, [token, matchId, navigate, applyEnded])

  const opponent = match
    ? match.youAre === "a"
      ? match.playerB
      : match.playerA
    : null

  const timerFields: TournamentTimerFields | undefined = useMemo(() => {
    if (!match?.startedAt) return undefined
    return {
      status: match.status === "ended" || match.status === "aborted" ? "Ended" : "Live",
      durationMinutes: match.durationMinutes,
      liveStartedAt: match.startedAt,
      pausedAt: null,
      resumeAt: null,
      pausedTotalMs: 0,
      endedAt: match.endedAt,
    }
  }, [match])

  const { remainingMs } = useTournamentTimer(
    timerFields ?? { status: "Open", durationMinutes: 0 },
  )
  const contestTimeExpired =
    match?.status === "ended" || match?.status === "aborted" || remainingMs === 0

  const forfeitMatch = useCallback(async () => {
    if (!token || !matchId || leaving || ended) return
    setLeaving(true)
    const [result, err] = await VersusService.leave(token, matchId)
    setLeaving(false)
    if (err || !result) {
      toast.error(err ?? "Failed to leave match")
      return
    }
    applyEnded(result)
  }, [token, matchId, leaving, ended, toast, applyEnded])

  const handleLeaveClick = () => {
    if (!matchActive) {
      void forfeitMatch()
      return
    }
    requestLeave()
  }

  const handleConfirmForfeit = () => {
    confirmLeave()
    void forfeitMatch()
  }

  const handleMatchEnded = useCallback(
    (event: VersusMatchEnded) => {
      applyEnded(event)
    },
    [applyEnded],
  )

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <QueryLoadingCard message="Loading versus arena…" />
      </div>
    )
  }

  const problems = match.problem ? [match.problem] : []

  return (
    <>
      <PlayArena
        backTo="/versus"
        backLabel="Versus"
        modeLabel={`1v1 · ${match.difficulty}`}
        title={
          opponent
            ? `vs ${opponent.displayName} · ${opponent.elo1v1}`
            : "Versus match"
        }
        problems={problems}
        timerFields={timerFields}
        contestTimeExpired={
          contestTimeExpired || match.status === "ended" || match.status === "aborted"
        }
        authToken={token}
        matchId={match.id}
        onMatchEnded={handleMatchEnded}
        onLeave={handleLeaveClick}
      />

      <Modal
        open={confirmOpen}
        onClose={cancelLeave}
        title="Leave match?"
        description="Leaving now will forfeit the game. Your opponent wins and your 1v1 ELO will drop."
        kicker="Versus"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={cancelLeave} disabled={leaving}>
              Stay
            </Button>
            <Button variant="danger" onClick={handleConfirmForfeit} disabled={leaving}>
              {leaving ? "Forfeiting…" : "Forfeit match"}
            </Button>
          </>
        }
      />

      {ended && (
        <div className="fixed inset-0 z-50 bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 sm:p-8 text-center">
            <p className="ui-kicker mb-2 justify-center">
              {ended.result === "abort" ? "Match aborted" : "Match ended"}
            </p>
            <h2 className="text-accent font-bold text-2xl mb-2 capitalize">
              {ended.result === "abort" ? "Aborted" : ended.result}
            </h2>
            {ended.result === "abort" ? (
              <p className="text-muted text-sm mb-6">
                The match was cancelled before it started. No ELO change.
              </p>
            ) : (
              <p className="text-muted text-sm mb-6">
                ELO {ended.yourEloDelta >= 0 ? "+" : ""}
                {ended.yourEloDelta}
              </p>
            )}
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate("/versus", { replace: true })}
            >
              Back to Versus
            </Button>
          </Card>
        </div>
      )}
    </>
  )
}

export default VersusPlay
