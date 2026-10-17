import { Link } from "react-router-dom"
import ReportButton from "../moderation/ReportButton"
import Badge from "../ui/Badge"
import type { TournamentStandings } from "../../types/api"

type StandingsTableProps = {
  standings: TournamentStandings | null
  compact?: boolean
  emptyMessage?: string
  tournamentId?: string
}

const StandingsTable = ({
  standings,
  compact = false,
  emptyMessage = "No solves yet.",
  tournamentId,
}: StandingsTableProps) => {
  const entries = standings?.entries ?? []
  const showElo = entries.some((entry) => entry.eloDelta != null)

  const formatEloDelta = (delta: number | undefined) => {
    if (delta == null) return "—"
    if (delta === 0) return "0"
    return `${delta > 0 ? "+" : ""}${delta}`
  }

  return (
    <table className={`ui-table ${compact ? "" : "min-w-[520px]"}`}>
      <thead>
        <tr>
          <th>{compact ? "#" : "Rank"}</th>
          <th>Player</th>
          <th>Solved</th>
          <th>Penalty</th>
          <th>Score</th>
          {showElo ? <th>ELO</th> : null}
          {tournamentId ? <th className="w-24" /> : null}
        </tr>
      </thead>
      <tbody>
        {entries.length === 0 ? (
          <tr>
            <td
              colSpan={(tournamentId ? 6 : 5) + (showElo ? 1 : 0)}
              className="text-center text-muted py-8"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          entries.map((entry) => (
            <tr key={entry.userId} className={entry.disqualified ? "opacity-60" : undefined}>
              <td className="tabular-nums">
                {entry.disqualified ? <Badge tone="danger">DQ</Badge> : entry.rank}
              </td>
              <td>
                <Link to={`/u/${entry.userId}`} className="text-accent hover:text-highlight hover:underline">
                  {entry.displayName}
                </Link>
              </td>
              <td className="tabular-nums">{entry.solved}</td>
              <td className="tabular-nums">{entry.penalty}</td>
              <td className="tabular-nums">{entry.score}</td>
              {showElo ? (
                <td
                  className={`tabular-nums ${
                    entry.eloDelta == null
                      ? "text-muted"
                      : entry.eloDelta > 0
                        ? "text-highlight"
                        : entry.eloDelta < 0
                          ? "text-danger"
                          : "text-muted"
                  }`}
                >
                  {formatEloDelta(entry.eloDelta)}
                </td>
              ) : null}
              {tournamentId ? (
                <td className="text-right">
                  <ReportButton
                    targetType="user"
                    targetId={entry.userId}
                    contextTournamentId={tournamentId}
                    label=""
                    variant="ghost"
                    className="!px-2"
                  />
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export default StandingsTable
