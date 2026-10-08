import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PlayArena from "../components/play/PlayArena"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import VersusMatchResults from "../components/play/VersusMatchResults"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useForfeitLeaveGuard } from "../hooks/useForfeitLeaveGuard"
import { useVersusProfileSync } from "../hooks/useVersusProfileSync"
import { useTournamentTimer } from "../hooks/useTournamentTimer"
import VersusService from "../services/VersusService"
import {
  leaveVersusResults,
  offerVersusDraw,
  offerVersusRematch,
  respondVersusDraw,
  subscribeVersusDrawDeclined,
  subscribeVersusDrawOffered,
  subscribeVersusEnded,
  subscribeVersusMatchFound,
  subscribeVersusRematchOffered,
  subscribeVersusRematchUnavailable,
  subscribeVersusStarted,
  subscribeVersusState,
  watchVersusMatch,
} from "../services/socket"
import type { VersusEndedReason, VersusMatch, VersusMatchEnded } from "../types/api"
import type { TournamentTimerFields } from "../types/api"

function endedFromMatch(data: VersusMatch): VersusMatchEnded {
  const isA = data.youAre === "a"
  const before = (isA ? data.playerAEloBefore : data.playerBEloBefore) ?? 0
  const after = (isA ? data.playerAEloAfter : data.playerBEloAfter) ?? before
  const endedReason: VersusEndedReason =
    data.endedReason ??
    (data.status === "aborted" ? "abort" : data.winnerId ? "first_ac" : "timeout")
  return {
    match: data,
    result:
      data.status === "aborted"
        ? "abort"
        : data.winnerId === (isA ? data.playerA.id : data.playerB?.id)
          ? "win"
          : data.winnerId
            ? "loss"
            : "draw",
    yourEloDelta: data.status === "aborted" ? 0 : after - before,
    endedReason,
    solveElapsedMinutes: data.solveElapsedMinutes,
  }
}

const VersusPlay = () => {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const [match, setMatch] = useState<VersusMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [ended, setEnded] = useState<VersusMatchEnded | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [drawRole, setDrawRole] = useState<"none" | "offered" | "received">("none")
  const [rematchState, setRematchState] = useState<"idle" | "waiting" | "incoming" | "gone">("idle")
  const redirectedRef = useRef(false)

  const matchActive = Boolean(match && match.status === "live" && !ended)
  const { confirmOpen, requestLeave, cancelLeave, confirmLeave } = useForfeitLeaveGuard(matchActive)

  const applyEnded = useCallback((event: VersusMatchEnded) => {
    setEnded(event)
    setMatch(event.match)
    setDrawRole("none")
  }, [])

  useVersusProfileSync(ended)

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
        applyEnded(endedFromMatch(data))
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
    const unsubFound = subscribeVersusMatchFound(token, (found) => {
      navigate(`/versus/lobby/${found.id}`, { replace: true })
    })
    const unsubDrawOffered = subscribeVersusDrawOffered(token, (payload) => {
      if (payload.matchId !== matchId) return
      setDrawRole("received")
    })
    const unsubDrawDeclined = subscribeVersusDrawDeclined(token, (payload) => {
      if (payload.matchId !== matchId) return
      setDrawRole("none")
      toast.error("Opponent declined a draw")
    })
    const unsubRematchOffered = subscribeVersusRematchOffered(token, (payload) => {
      if (payload.matchId !== matchId) return
      setRematchState("incoming")
    })
    const unsubRematchGone = subscribeVersusRematchUnavailable(token, (payload) => {
      if (payload.matchId !== matchId) return
      setRematchState("gone")
    })

    return () => {
      unsubState()
      unsubStarted()
      unsubEnded()
      unsubFound()
      unsubDrawOffered()
      unsubDrawDeclined()
      unsubRematchOffered()
      unsubRematchGone()
    }
  }, [token, matchId, navigate, applyEnded, toast])

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

  const handleOfferDraw = async () => {
    if (!token || !matchId) return
    const ack = await offerVersusDraw(token, matchId)
    if (!ack.ok) {
      toast.error(ack.error)
      return
    }
    setDrawRole("offered")
  }

  const handleDrawRespond = async (accept: boolean) => {
    if (!token || !matchId) return
    const ack = await respondVersusDraw(token, matchId, accept)
    if (!ack.ok) {
      toast.error(ack.error)
      return
    }
    setDrawRole("none")
  }

  const handleRematch = async () => {
    if (!token || !matchId) return
    const ack = await offerVersusRematch(token, matchId)
    if (!ack.ok) {
      toast.error(ack.error)
      if (ack.error.toLowerCase().includes("left")) setRematchState("gone")
      return
    }
    if (!ack.accepted) setRematchState("waiting")
  }

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <QueryLoadingCard message="Loading versus arena…" />
      </div>
    )
  }

  const problems = match.problem ? [match.problem] : []

  const drawActions =
    matchActive ? (
      drawRole === "received" ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted hidden sm:inline">Draw offered</span>
          <Button variant="secondary" className="!py-1.5 !px-3 text-sm" onClick={() => void handleDrawRespond(false)}>
            Decline
          </Button>
          <Button variant="primary" className="!py-1.5 !px-3 text-sm" onClick={() => void handleDrawRespond(true)}>
            Accept draw
          </Button>
        </div>
      ) : drawRole === "offered" ? (
        <Button variant="secondary" className="!py-1.5 !px-3 text-sm" onClick={() => void handleDrawRespond(false)}>
          Cancel offer
        </Button>
      ) : (
        <Button variant="secondary" className="!py-1.5 !px-3 text-sm" onClick={() => void handleOfferDraw()}>
          Offer draw
        </Button>
      )
    ) : null

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
        onMatchEnded={applyEnded}
        onLeave={handleLeaveClick}
        matchActions={drawActions}
      />

      {drawRole === "offered" && matchActive ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ui-card px-4 py-2 text-sm text-accent">
          Waiting for opponent to accept a draw…
        </div>
      ) : null}

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
        <VersusMatchResults
          ended={ended}
          rematchBusy={rematchState === "waiting"}
          rematchDisabled={rematchState === "gone"}
          rematchLabel={
            rematchState === "gone"
              ? "Opponent left"
              : rematchState === "incoming"
                ? "Accept rematch"
                : rematchState === "waiting"
                  ? "Waiting…"
                  : "Rematch"
          }
          onRematch={() => void handleRematch()}
          onFindMatch={() => {
            if (token) void leaveVersusResults(token, ended.match.id)
            navigate(`/versus?difficulty=${ended.match.difficulty}`, { replace: true })
          }}
          onReview={() => navigate(`/versus/review/${ended.match.id}`)}
          onBack={() => {
            if (token) void leaveVersusResults(token, ended.match.id)
            navigate("/versus", { replace: true })
          }}
        />
      )}
    </>
  )
}

export default VersusPlay
