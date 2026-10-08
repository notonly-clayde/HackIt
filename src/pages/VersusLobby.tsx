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
import { useVersusProfileSync } from "../hooks/useVersusProfileSync"
import VersusService from "../services/VersusService"
import {
  getLobbySocket,
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
  const [starting, setStarting] = useState(false)
  const prevSecondsRef = useRef<number | null>(null)
  const redirectedRef = useRef(false)

  useVersusProfileSync(ended)

  const goToPlay = (id: string) => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    navigate(`/versus/play/${id}`, { replace: true })
  }

  const applyEndedFromMatch = (data: VersusMatch) => {
    setEnded({
      match: data,
      result:
        data.status === "aborted"
          ? "abort"
          : data.winnerId === (data.youAre === "a" ? data.playerA.id : data.playerB?.id)
            ? "win"
            : data.winnerId
              ? "loss"
              : "draw",
      yourEloDelta:
        data.status === "aborted"
          ? 0
          : (data.youAre === "a"
              ? (data.playerAEloAfter ?? data.playerAEloBefore)
              : (data.playerBEloAfter ?? data.playerBEloBefore ?? 0)) -
            ((data.youAre === "a" ? data.playerAEloBefore : data.playerBEloBefore) ?? 0),
      endedReason:
        data.endedReason ??
        (data.status === "aborted" ? "abort" : data.winnerId ? "first_ac" : "timeout"),
      solveElapsedMinutes: data.solveElapsedMinutes,
    })
  }

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
        goToPlay(data.id)
      } else if (data.status === "ended" || data.status === "aborted") {
        applyEndedFromMatch(data)
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
      if (next.status === "live") {
        goToPlay(next.id)
      }
    })
    const unsubStarted = subscribeVersusStarted(token, (event) => {
      if (event.matchId !== matchId) return
      goToPlay(event.matchId)
    })
    const unsubEnded = subscribeVersusEnded(token, (event) => {
      if (event.match.id !== matchId) return
      setEnded(event)
      setMatch(event.match)
    })

    const client = getLobbySocket(token)
    const rewatch = () => {
      void watchVersusMatch(token, matchId)
    }
    client.on("connect", rewatch)

    return () => {
      unsubState()
      unsubStarted()
      unsubEnded()
      client.off("connect", rewatch)
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

  // Countdown is display-only; when it hits 0, poll REST so a missed socket still starts play.
  useEffect(() => {
    if (!token || !matchId || !match || match.status !== "lobby" || ended || secondsLeft > 0) {
      return
    }

    let cancelled = false
    setStarting(true)

    const poll = async () => {
      const [data] = await VersusService.getMatch(token, matchId)
      if (cancelled || !data || redirectedRef.current) return false
      setMatch(data)
      if (data.status === "live") {
        goToPlay(data.id)
        return true
      }
      if (data.status === "ended" || data.status === "aborted") {
        applyEndedFromMatch(data)
        return true
      }
      return false
    }

    void poll()
    const id = window.setInterval(() => {
      void poll().then((done) => {
        if (done) window.clearInterval(id)
      })
    }, 500)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [token, matchId, match?.status, ended, secondsLeft])

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
  const waitingForGuest = match?.status === "lobby" && !opponent
  const urgent = secondsLeft <= URGENCY_THRESHOLD_SECONDS && secondsLeft > 0
  const reduceMotion = prefersReducedMotion()

  const copyRoomId = async () => {
    if (!match) return
    try {
      await navigator.clipboard.writeText(match.id)
      toast.success("Room ID copied")
    } catch {
      toast.error("Could not copy room ID")
    }
  }

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

  if (loading || !match || !you || (!opponent && !waitingForGuest)) {
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
            <p className="ui-kicker mb-1">
              {match.kind === "private" ? "Private room" : "Onboarding lobby"}
            </p>
            <h1 className="text-accent font-bold text-xl sm:text-2xl tracking-tight">
              {match.lobbyName || "Versus match"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="open" className="capitalize">
              {match.difficulty}
            </Badge>
            <Button variant="secondary" disabled={leaving || Boolean(ended)} onClick={() => void handleLeave()}>
              {leaving ? "Aborting…" : waitingForGuest ? "Close room" : "Abort"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-start flex-1">
          <PlayerCard player={you} label="You" highlight />

          {!opponent ? (
            <div className="flex flex-col items-center justify-center py-4 lg:py-10 min-w-[10rem] max-w-xs mx-auto text-center">
              <p className="text-muted text-xs uppercase tracking-widest mb-2">Waiting for friend</p>
              <p className="text-muted text-sm mb-3">
                Share this room ID. The match countdown starts as soon as they join.
              </p>
              <code className="block w-full break-all rounded-xl border border-border bg-primary/40 px-3 py-2 font-mono text-sm text-accent">
                {match.id}
              </code>
              <Button variant="primary" className="w-full mt-3" onClick={() => void copyRoomId()}>
                Copy room ID
              </Button>
              {match.passwordProtected ? (
                <p className="text-muted text-xs mt-2">Your friend will also need the room password.</p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 lg:py-10 min-w-[10rem]">
              <p className="text-muted text-xs uppercase tracking-widest mb-2">
                {starting || secondsLeft <= 0 ? "Starting match" : "Match starts in"}
              </p>
              <div
                className={`font-mono tabular-nums font-bold tracking-tight ${
                  starting || secondsLeft <= 0
                    ? `text-highlight text-4xl sm:text-5xl ${reduceMotion ? "" : "animate-pulse"}`
                    : urgent
                      ? `text-danger text-5xl sm:text-6xl ${reduceMotion ? "" : "animate-pulse"}`
                      : "text-highlight text-4xl sm:text-5xl"
                }`}
              >
                {starting || secondsLeft <= 0 ? "…" : secondsLeft}
              </div>
              <p className="text-muted text-sm mt-3">vs</p>
              <p className="text-accent font-semibold mt-1 truncate max-w-[12rem]">
                {opponent.displayName}
              </p>
            </div>
          )}

          {opponent ? (
            <PlayerCard player={opponent} label="Opponent" />
          ) : (
            <Card className="p-5 sm:p-6 border-dashed">
              <p className="ui-kicker mb-3">Opponent</p>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full border border-dashed border-border bg-primary/40" />
                <p className="text-muted text-sm">Open seat — waiting for your friend to join…</p>
              </div>
            </Card>
          )}
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
