import { useEffect, useState } from "react"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { useHudSound } from "../../contexts/SoundContext"
import { prefersReducedMotion } from "../../lib/hudSound"
import type { VersusMatchEnded } from "../../types/api"

const BEAT_MS = 1000

function headline(result: VersusMatchEnded["result"]) {
  if (result === "win") return "Victory"
  if (result === "loss") return "Defeat"
  if (result === "draw") return "Draw"
  return "Aborted"
}

function story(ended: VersusMatchEnded) {
  const reason = ended.endedReason ?? ended.match.endedReason
  if (ended.result === "abort" || reason === "abort") {
    return "The match was cancelled before it started. No ELO change."
  }
  if (reason === "first_ac" && ended.result === "win") return "You solved it first."
  if (reason === "first_ac" && ended.result === "loss") return "Opponent got Accepted first."
  if (reason === "forfeit" && ended.result === "win") return "Opponent forfeited."
  if (reason === "forfeit" && ended.result === "loss") return "You left the match."
  if (reason === "agreed_draw") return "You both agreed to a draw."
  if (reason === "timeout" || ended.result === "draw") return "Time ran out — neither solved."
  return ended.result === "win" ? "You won the match." : "Opponent won the match."
}

type VersusMatchResultsProps = {
  ended: VersusMatchEnded
  rematchBusy?: boolean
  rematchDisabled?: boolean
  rematchLabel?: string
  onRematch: () => void
  onFindMatch: () => void
  onReview?: () => void
  onBack: () => void
}

const VersusMatchResults = ({
  ended,
  rematchBusy,
  rematchDisabled,
  rematchLabel = "Rematch",
  onRematch,
  onFindMatch,
  onReview,
  onBack,
}: VersusMatchResultsProps) => {
  const { play } = useHudSound()
  const [phase, setPhase] = useState<"beat" | "card">("beat")
  const reduceMotion = prefersReducedMotion()

  useEffect(() => {
    setPhase("beat")
    if (ended.result === "win") play("victory")
    else if (ended.result === "loss") play("defeat")
    else play("alert")

    const delay = reduceMotion ? 200 : BEAT_MS
    const id = window.setTimeout(() => setPhase("card"), delay)
    return () => window.clearTimeout(id)
  }, [ended.match.id, ended.result, play, reduceMotion])

  const youAreA = ended.match.youAre === "a"
  const before = (youAreA ? ended.match.playerAEloBefore : ended.match.playerBEloBefore) ?? 0
  const after = (youAreA ? ended.match.playerAEloAfter : ended.match.playerBEloAfter) ?? before
  const opponent = youAreA ? ended.match.playerB : ended.match.playerA
  const solve = ended.solveElapsedMinutes ?? ended.match.solveElapsedMinutes

  const title = headline(ended.result)

  if (phase === "beat" && ended.result !== "abort") {
    return (
      <div className="fixed inset-0 z-50 bg-primary/90 backdrop-blur-sm flex items-center justify-center p-4">
        <p
          className={`font-bold tracking-tight text-accent ${
            reduceMotion ? "text-5xl" : "text-5xl sm:text-7xl animate-pulse"
          }`}
        >
          {title}
        </p>
      </div>
    )
  }

  const canReview = ended.result !== "abort" && ended.match.status === "ended"

  return (
    <div className="fixed inset-0 z-50 bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8 text-center">
        <p className="ui-kicker mb-2 justify-center">Match over</p>
        <h2 className="text-accent font-bold text-3xl mb-2">{title}</h2>
        <p className="text-muted text-sm mb-5">{story(ended)}</p>

        {ended.result !== "abort" && opponent ? (
          <div className="rounded-xl border border-border bg-primary/40 px-4 py-3 mb-5 text-sm text-left space-y-1.5">
            <p className="text-accent">
              vs <span className="font-semibold">{opponent.displayName}</span>
              <span className="text-muted"> · {ended.match.difficulty}</span>
            </p>
            <p className="text-accent tabular-nums">
              ELO {before.toLocaleString()} → {after.toLocaleString()}{" "}
              <span className="text-muted">
                ({ended.yourEloDelta >= 0 ? "+" : ""}
                {ended.yourEloDelta})
              </span>
            </p>
            {solve != null ? (
              <p className="text-muted">Solved in {solve} min</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {ended.result !== "abort" ? (
            <>
              <Button
                variant="primary"
                className="w-full"
                disabled={rematchDisabled || rematchBusy}
                onClick={onRematch}
              >
                {rematchBusy ? "Waiting…" : rematchLabel}
              </Button>
              <Button variant="secondary" className="w-full" onClick={onFindMatch}>
                Find match
              </Button>
              {canReview && onReview ? (
                <Button variant="ghost" className="w-full" onClick={onReview}>
                  Review match
                </Button>
              ) : null}
            </>
          ) : null}
          <Button variant={ended.result === "abort" ? "primary" : "ghost"} className="w-full" onClick={onBack}>
            Back to Versus
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default VersusMatchResults
