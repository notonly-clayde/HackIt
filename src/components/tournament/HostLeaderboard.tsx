import { HiOutlineExclamationTriangle } from "react-icons/hi2"
import Badge from "../ui/Badge"
import type { TournamentStandings } from "../../types/api"
import { MAX_TOURNAMENT_WARNINGS } from "../../types/api"

type HostLeaderboardProps = {
  standings: TournamentStandings | null
  selectedUserId: string | null
  onSelect: (userId: string) => void
  warningCounts?: Record<string, number>
}

function shortPlayerId(userId: string): string {
  return userId.slice(-4)
}

const HostLeaderboard = ({ standings, selectedUserId, onSelect, warningCounts = {} }: HostLeaderboardProps) => {
  const entries = standings?.entries ?? []

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-10">
        No solves yet. Rankings update when players submit.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const selected = entry.userId === selectedUserId
        const warnCount = warningCounts[entry.userId] ?? 0
        return (
          <button
            key={entry.userId}
            type="button"
            onClick={() => onSelect(entry.userId)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
              selected
                ? "border-highlight bg-highlight/10"
                : "border-border bg-surface/40 hover:border-highlight/40 hover:bg-surface/70"
            } ${entry.disqualified ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted tabular-nums mb-0.5">
                  {entry.disqualified ? <Badge tone="danger">DQ</Badge> : entry.rank}
                </p>
                <p className={`text-accent font-medium truncate flex items-center gap-1.5 ${entry.disqualified ? "line-through" : ""}`}>
                  {!entry.disqualified && warnCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 shrink-0 text-amber-400" title="Warnings">
                      <HiOutlineExclamationTriangle className="h-4 w-4" aria-hidden />
                      <span className="text-xs font-semibold tabular-nums text-amber-300">
                        {warnCount}/{MAX_TOURNAMENT_WARNINGS}
                      </span>
                    </span>
                  )}
                  <span className="truncate">
                    {entry.displayName}{" "}
                    <span className="text-muted font-normal">({shortPlayerId(entry.userId)})</span>
                  </span>
                </p>
              </div>
              <p className="text-accent font-semibold tabular-nums shrink-0">
                {entry.score.toLocaleString()} pts
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default HostLeaderboard
