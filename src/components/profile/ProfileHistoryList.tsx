import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import Badge from "../ui/Badge"
import EmptyState from "../ui/EmptyState"
import QueryLoadingCard from "../ui/QueryLoadingCard"
import { useQueryErrorToast } from "../../hooks/useQueryErrorToast"
import { queryKeys } from "../../lib/queryKeys"
import { STALE_TIME } from "../../lib/queryClient"
import { unwrap } from "../../lib/unwrap"
import UserService from "../../services/UserService"
import type {
  ProfileHistoryItem,
  ProfileHistoryKind,
  ProfileHistoryTournamentItem,
  ProfileHistoryVersusItem,
} from "../../types/api"

const filterOptions: { value: ProfileHistoryKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "versus", label: "1v1" },
  { value: "tournament", label: "Tournament" },
]

const emptyCopy: Record<ProfileHistoryKind, { title: string; description: string }> = {
  all: { title: "No history yet", description: "1v1 matches and finished tournaments will show up here." },
  versus: { title: "No 1v1 matches yet", description: "Ranked and private 1v1 results will show up here." },
  tournament: { title: "No tournaments yet", description: "Finished tournaments will show up here with the final rank." },
}

const rowLinkClass =
  "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/60"

function formatEndedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return ""
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function resultTone(result: ProfileHistoryVersusItem["result"]): "success" | "danger" | "neutral" {
  if (result === "win") return "success"
  if (result === "loss") return "danger"
  return "neutral"
}

function resultLabel(result: ProfileHistoryVersusItem["result"]): string {
  if (result === "win") return "W"
  if (result === "loss") return "L"
  return "D"
}

type ProfileHistoryListProps = {
  userId: string
  token: string | null
  canReview?: boolean
}

const ProfileHistoryList = ({ userId, token, canReview = false }: ProfileHistoryListProps) => {
  const [kind, setKind] = useState<ProfileHistoryKind>("all")
  const { data = [], isLoading, error } = useQuery({
    queryKey: [...queryKeys.users.history(userId), kind],
    queryFn: async () => unwrap(await UserService.listHistory(token, userId, kind)),
    enabled: Boolean(userId) && Boolean(token),
    staleTime: STALE_TIME.detail,
  })
  useQueryErrorToast(error)

  return (
    <section className="mt-10 sm:mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-l-2 border-highlight/40 pl-3">
        <h2 className="text-accent font-bold text-xl sm:text-2xl tracking-tight">History</h2>
        <div className="flex items-center gap-3">
          <span className="text-muted text-sm tabular-nums">
            {isLoading ? "…" : `${data.length} recent`}
          </span>
          <div className="ui-view-toggle" role="group" aria-label="Filter history">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="text-xs font-semibold"
                aria-pressed={kind === option.value}
                onClick={() => setKind(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <QueryLoadingCard message="Loading history…" />
      ) : data.length === 0 ? (
        <EmptyState title={emptyCopy[kind].title} description={emptyCopy[kind].description} />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((item) => (
            <li key={historyKey(item)}>
              {item.kind === "tournament" ? (
                <Link to={`/tournament/${item.tournamentId}`} className={rowLinkClass}>
                  <TournamentRow item={item} />
                </Link>
              ) : canReview ? (
                <Link to={`/versus/review/${item.matchId}`} className={rowLinkClass}>
                  <VersusRow item={item} linkOpponent={false} />
                </Link>
              ) : (
                <VersusRow item={item} linkOpponent />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function historyKey(item: ProfileHistoryItem): string {
  return item.kind === "tournament" ? `tournament-${item.tournamentId}` : `versus-${item.matchId}`
}

function KindTag({ kind }: { kind: ProfileHistoryItem["kind"] }) {
  return kind === "tournament" ? (
    <Badge tone="warn" className="shrink-0">Tournament</Badge>
  ) : (
    <Badge tone="soon" className="shrink-0">1v1</Badge>
  )
}

function VersusRow({ item, linkOpponent }: { item: ProfileHistoryVersusItem; linkOpponent: boolean }) {
  const delta = item.eloDelta
  const deltaLabel = `${delta >= 0 ? "+" : ""}${delta}`

  const name = linkOpponent ? (
    <Link to={`/u/${item.opponent.id}`} className="font-semibold text-accent hover:text-highlight">
      {item.opponent.displayName}
    </Link>
  ) : (
    <span className="font-semibold text-accent">{item.opponent.displayName}</span>
  )

  return (
    <div className="ui-card ui-card-hover px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3">
      <Badge tone={resultTone(item.result)} className="min-w-8 justify-center shrink-0">
        {resultLabel(item.result)}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          vs {name}
          <span className="text-muted capitalize"> · {item.difficulty}</span>
        </p>
        <p className="text-xs text-muted mt-0.5 tabular-nums">
          {item.eloBefore.toLocaleString()} → {item.eloAfter.toLocaleString()}{" "}
          <span className={delta >= 0 ? "text-highlight" : "text-danger"}>({deltaLabel})</span>
        </p>
      </div>
      <KindTag kind="versus" />
      {item.endedAt ? (
        <span className="text-xs text-muted tabular-nums shrink-0">{formatEndedAt(item.endedAt)}</span>
      ) : null}
    </div>
  )
}

function TournamentRow({ item }: { item: ProfileHistoryTournamentItem }) {
  return (
    <div className="ui-card ui-card-hover px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3">
      <Badge
        tone={item.rank === 1 ? "success" : "neutral"}
        className="min-w-8 justify-center shrink-0 tabular-nums"
      >
        #{item.rank} / {item.rankTotal}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          <span className="font-semibold text-accent">{item.name}</span>
          <span className="text-muted"> · {item.tournamentType === "ffa" ? "Free For All" : "1v1 Match"}</span>
        </p>
        <p className="text-xs text-muted mt-0.5 tabular-nums">
          {item.solved} solved · {item.score.toLocaleString()} pts
        </p>
      </div>
      <KindTag kind="tournament" />
      <span className="text-xs text-muted tabular-nums shrink-0">{formatEndedAt(item.endedAt)}</span>
    </div>
  )
}

export default ProfileHistoryList
