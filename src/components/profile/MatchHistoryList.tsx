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
import type { MatchHistoryItem } from "../../types/api"

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

function resultTone(result: MatchHistoryItem["result"]): "success" | "danger" | "neutral" {
  if (result === "win") return "success"
  if (result === "loss") return "danger"
  return "neutral"
}

function resultLabel(result: MatchHistoryItem["result"]): string {
  if (result === "win") return "W"
  if (result === "loss") return "L"
  return "D"
}

type MatchHistoryListProps = {
  userId: string
  token: string | null
  canReview?: boolean
  emptyDescription?: string
}

const MatchHistoryList = ({
  userId,
  token,
  canReview = false,
  emptyDescription = "1v1 results will show up here after you compete.",
}: MatchHistoryListProps) => {
  const { data = [], isLoading, error } = useQuery({
    queryKey: queryKeys.users.matches(userId),
    queryFn: async () => unwrap(await UserService.listMatches(token, userId)),
    enabled: Boolean(userId) && Boolean(token),
    staleTime: STALE_TIME.detail,
  })
  useQueryErrorToast(error)

  return (
    <section className="mt-10 sm:mt-12">
      <div className="flex items-center justify-between mb-5 border-l-2 border-highlight/40 pl-3">
        <h2 className="text-accent font-bold text-xl sm:text-2xl tracking-tight">Match history</h2>
        <span className="text-muted text-sm tabular-nums">
          {isLoading ? "…" : `${data.length} recent`}
        </span>
      </div>

      {isLoading ? (
        <QueryLoadingCard message="Loading match history…" />
      ) : data.length === 0 ? (
        <EmptyState title="No matches yet" description={emptyDescription} />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((item) => {
            const row = <HistoryRow item={item} linkOpponent={!canReview} />
            return (
              <li key={item.matchId}>
                {canReview ? (
                  <Link
                    to={`/versus/review/${item.matchId}`}
                    className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/60"
                  >
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function HistoryRow({
  item,
  linkOpponent,
}: {
  item: MatchHistoryItem
  linkOpponent: boolean
}) {
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
      <Badge tone={resultTone(item.result)} className="w-8 justify-center shrink-0">
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
      {item.endedAt ? (
        <span className="text-xs text-muted tabular-nums shrink-0">{formatEndedAt(item.endedAt)}</span>
      ) : null}
    </div>
  )
}

export default MatchHistoryList
