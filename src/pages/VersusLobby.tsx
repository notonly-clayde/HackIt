import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useHudSound } from "../contexts/SoundContext"
import { prefersReducedMotion } from "../lib/hudSound"
import VersusService from "../services/VersusService"
import {
  subscribeVersusEnded,
  subscribeVersusStarted,
  subscribeVersusState,
  watchVersusMatch,
} from "../services/socket"
import type { VersusMatch, VersusMatchEnded, VersusPlayerCard } from "../types/api"

const URGENCY_THRESHOLD_SECONDS = 10

function PlayerCard({
  player,
  label,
  highlight,
}: {
  player: VersusPlayerCard
  label: string
  highlight?: boolean
}) {
  const initials =
    player.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "H"

  const winRatePct = Math.round(player.winRate * 100)

  return (
    <Card className={`p-5 sm:p-6 ${highlight ? "ring-1 ring-highlight/40" : ""}`}>
      <p className="ui-kicker mb-3">{label}</p>
      <div className="flex items-center gap-3 mb-5">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-highlight/20 text-accent flex items-center justify-center font-bold text-lg">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-accent font-bold text-lg truncate">{player.displayName}</h2>
          <p className="text-muted text-sm">ELO {player.elo1v1.toLocaleString()}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Peak ELO" value={player.peakElo1v1.toLocaleString()} />
        <Stat label="Win rate" value={`${winRatePct}%`} />
        <Stat label="Matches" value={String(player.matchCount)} />
        <Stat label="Win streak" value={String(player.winStreak1v1)} />
        <Stat
          label="Record"
          value={`${player.wins}–${player.losses}–${player.draws}`}
          className="col-span-2"
        />
      </dl>
    </Card>
  )
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-border bg-primary/40 px-3 py-2 ${className}`}>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-accent font-semibold mt-0.5 tabular-nums">{value}</dd>
    </div>
  )
}

const VersusLobby = () => {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { play } = useHudSound()
  const [match, setMatch] = useState<VersusMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [ended, setEnded] = useState<VersusMatchEnded | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const prevSecondsRef = useRef<number | null>(null)
  const redirectedRef = useRef(false)

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
      if (data.status === "live") {
        redirectedRef.current = true
        navigate(`/versus/play/${data.id}`, { replace: true })
      } else if (data.status === "ended" || data.status === "aborted") {
        setEnded({
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
  }, [token, matchId, navigate, toast])

  useEffect(() => {
    if (!token || !matchId) return

    const unsubState = subscribeVersusState(token, (next) => {
      if (next.id !== matchId) return
      setMatch(next)
      if (next.status === "live" && !redirectedRef.current) {
        redirectedRef.current = true
        navigate(`/versus/play/${next.id}`, { replace: true })
      }
    })
    const unsubStarted = subscribeVersusStarted(token, (event) => {
      if (event.matchId !== matchId || redirectedRef.current) return
      redirectedRef.current = true
      navigate(`/versus/play/${event.matchId}`, { replace: true })
    })
    const unsubEnded = subscribeVersusEnded(token, (event) => {
      if (event.match.id !== matchId) return
      setEnded(event)
      setMatch(event.match)
    })

    return () => {
      unsubState()
      unsubStarted()
      unsubEnded()
    }
  }, [token, matchId, navigate])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])

  const secondsLeft = useMemo(() => {
    if (!match?.lobbyEndsAt) return 0
    return Math.max(0, Math.ceil((new Date(match.lobbyEndsAt).getTime() - now) / 1000))
  }, [match?.lobbyEndsAt, now])

  useEffect(() => {
    if (!match || match.status !== "lobby" || ended) {
      prevSecondsRef.current = null
      return
    }

    if (secondsLeft > URGENCY_THRESHOLD_SECONDS || secondsLeft <= 0) {
      prevSecondsRef.current = secondsLeft
      return
    }

    if (prevSecondsRef.current !== secondsLeft) {
      play("urgency")
      prevSecondsRef.current = secondsLeft
    }
  }, [match, secondsLeft, ended, play])

  const you = match ? (match.youAre === "a" ? match.playerA : match.playerB) : null
  const opponent = match ? (match.youAre === "a" ? match.playerB : match.playerA) : null
  const urgent = secondsLeft <= URGENCY_THRESHOLD_SECONDS && secondsLeft > 0
  const reduceMotion = prefersReducedMotion()

  const handleLeave = async () => {
    if (!token || !matchId || leaving) return
    setLeaving(true)
    const [result, err] = await VersusService.leave(token, matchId)
    setLeaving(false)
    if (err || !result) {
      toast.error(err ?? "Failed to abort match")
      return
    }
    setEnded(result)
    setMatch(result.match)
  }

  if (loading || !match || !you || !opponent) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <QueryLoadingCard message="Loading match lobby…" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="page-container py-6 sm:py-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <p className="ui-kicker mb-1">Onboarding lobby</p>
            <h1 className="text-accent font-bold text-xl sm:text-2xl tracking-tight">
              Versus match
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="open" className="capitalize">
              {match.difficulty}
            </Badge>
            <Button variant="secondary" disabled={leaving || Boolean(ended)} onClick={() => void handleLeave()}>
              {leaving ? "Aborting…" : "Abort"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-start flex-1">
          <PlayerCard player={you} label="You" highlight />

          <div className="flex flex-col items-center justify-center py-4 lg:py-10 min-w-[10rem]">
            <p className="text-muted text-xs uppercase tracking-widest mb-2">Match starts in</p>
            <div
              className={`font-mono tabular-nums font-bold tracking-tight ${
                urgent
                  ? `text-danger text-5xl sm:text-6xl ${reduceMotion ? "" : "animate-pulse"}`
                  : "text-highlight text-4xl sm:text-5xl"
              }`}
            >
              {secondsLeft}
            </div>
            <p className="text-muted text-sm mt-3">vs</p>
            <p className="text-accent font-semibold mt-1 truncate max-w-[12rem]">
              {opponent.displayName}
            </p>
          </div>

          <PlayerCard player={opponent} label="Opponent" />
        </div>
      </div>

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
                {profile
                  ? ` · now ${ended.match.youAre === "a" ? ended.match.playerAEloAfter : ended.match.playerBEloAfter}`
                  : null}
              </p>
            )}
            <Button variant="primary" className="w-full" onClick={() => navigate("/versus", { replace: true })}>
              Back to Versus
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

export default VersusLobby
