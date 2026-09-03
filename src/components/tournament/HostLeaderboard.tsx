import type { TournamentStandings } from "../../types/api"

type HostLeaderboardProps = {
  standings: TournamentStandings | null
  selectedUserId: string | null
  onSelect: (userId: string) => void
}

function shortPlayerId(userId: string): string {
  return userId.slice(-4)
}

const HostLeaderboard = ({ standings, selectedUserId, onSelect }: HostLeaderboardProps) => {
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
        return (
          <button
            key={entry.userId}
            type="button"
            onClick={() => onSelect(entry.userId)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
              selected
                ? "border-highlight bg-highlight/10"
                : "border-border bg-surface/40 hover:border-highlight/40 hover:bg-surface/70"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted tabular-nums mb-0.5">{entry.rank}</p>
                <p className="text-accent font-medium truncate">
                  {entry.displayName}{" "}
                  <span className="text-muted font-normal">({shortPlayerId(entry.userId)})</span>
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
