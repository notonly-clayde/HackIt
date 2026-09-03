import Badge from "../ui/Badge"
import type { TournamentTimerFields } from "../../types/api"
import { useTournamentTimer } from "../../hooks/useTournamentTimer"

type TournamentTimerProps = {
  fields: TournamentTimerFields
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
}

const TournamentTimer = ({ fields, className = "", size = "md" }: TournamentTimerProps) => {
  const { display, isPaused, isResuming, isEnded, isActive } = useTournamentTimer(fields)

  if (!isActive && !isEnded) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-right">
        <p className="text-[0.65rem] uppercase tracking-wider text-muted">Time remaining</p>
        <p className={`font-bold tabular-nums tracking-tight text-accent ${sizeClasses[size]}`}>
          {isEnded ? "00:00" : (display ?? "--:--")}
        </p>
      </div>
      {isResuming && !isEnded && <Badge tone="warn">Resuming</Badge>}
      {isPaused && !isResuming && !isEnded && <Badge tone="warn">Paused</Badge>}
      {isEnded && <Badge tone="neutral">Ended</Badge>}
    </div>
  )
}

export default TournamentTimer
