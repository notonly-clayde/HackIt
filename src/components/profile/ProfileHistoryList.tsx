import { useState, type ReactNode } from "react"
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
import { formatRelativeTime } from "../../utils/relativeTime"
import type {
  ProfileHistoryItem,
  ProfileHistoryKind,
  ProfileHistoryPrivateItem,
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
  title?: ReactNode
}

const ProfileHistoryList = ({ userId, token, canReview = false, title = "History" }: ProfileHistoryListProps) => {
  const [kind, setKind] = useState<ProfileHistoryKind>("all")
  const { data = [], isLoading, error } = useQuery({
    queryKey: [...queryKeys.users.history(userId), kind],
    queryFn: async () => unwrap(await UserService.listHistory(token, userId, kind)),
    enabled: Boolean(userId) && Boolean(token),
    staleTime: STALE_TIME.detail,
  })
  useQueryErrorToast(error)

  const plainTitle = typeof title === "string"

  return (
    <section className="mt-10 sm:mt-12">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-5 ${plainTitle ? "border-l-2 border-highlight/40 pl-3" : ""}`}
      >
        {plainTitle ? (
          <h2 className="text-accent font-bold text-xl sm:text-2xl tracking-tight">{title}</h2>
        ) : (
          <div className="min-w-0">{title}</div>
        )}
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
              ) : item.kind === "private" ? (
                <PrivateRow item={item} />
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
  if (item.kind === "tournament") return `tournament-${item.tournamentId}`
  if (item.kind === "private") return `private-${item.matchId}`
  return `versus-${item.matchId}`
}

function KindTag({ kind }: { kind: ProfileHistoryItem["kind"] }) {
  if (kind === "tournament") {
    return (
      <Badge tone="warn" className="shrink-0">
        Tournament
      </Badge>
    )
  }
  if (kind === "private") {
    return (
      <Badge tone="neutral" className="shrink-0">
        Private
      </Badge>
    )
  }
  return (
    <Badge tone="soon" className="shrink-0">
      1v1
    </Badge>
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
          <span className="text-muted capitalize">
            {item.matchKind === "private" ? " · Private" : ""} · {item.difficulty}
          </span>
        </p>
        <p className="text-xs text-muted mt-0.5 tabular-nums">
          {item.eloBefore.toLocaleString()} → {item.eloAfter.toLocaleString()}{" "}
          <span className={delta >= 0 ? "text-highlight" : "text-danger"}>({deltaLabel})</span>
        </p>
      </div>
      <KindTag kind="versus" />
      {item.endedAt ? (
        <span className="text-xs text-muted tabular-nums shrink-0">{formatRelativeTime(item.endedAt)}</span>
      ) : null}
    </div>
  )
}

function PrivateRow({ item }: { item: ProfileHistoryPrivateItem }) {
  return (
    <div className="ui-card ui-card-hover px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3">
      <Badge tone="neutral" className="min-w-8 justify-center shrink-0">
        Aborted
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          <span className="font-semibold text-accent">{item.name}</span>
          <span className="text-muted capitalize"> · 1v1 Match · {item.difficulty}</span>
          {item.passwordProtected ? <span className="text-muted"> · Password</span> : null}
        </p>
        <p className="text-xs text-muted mt-0.5">Private room closed before the match went live</p>
      </div>
      <KindTag kind="private" />
      <span className="text-xs text-muted tabular-nums shrink-0">{formatRelativeTime(item.endedAt)}</span>
    </div>
  )
}

function TournamentRow({ item }: { item: ProfileHistoryTournamentItem }) {
  const hasElo =
    item.eloBefore != null && item.eloAfter != null && item.eloDelta != null
  const delta = item.eloDelta ?? 0
  const deltaLabel = `${delta >= 0 ? "+" : ""}${delta}`

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
          {hasElo ? (
            <>
              {" · "}
              {item.eloBefore!.toLocaleString()} → {item.eloAfter!.toLocaleString()}{" "}
              <span className={delta >= 0 ? "text-highlight" : "text-danger"}>({deltaLabel})</span>
            </>
          ) : null}
        </p>
      </div>
      <KindTag kind="tournament" />
      <span className="text-xs text-muted tabular-nums shrink-0">{formatRelativeTime(item.endedAt)}</span>
    </div>
  )
}

export default ProfileHistoryList
