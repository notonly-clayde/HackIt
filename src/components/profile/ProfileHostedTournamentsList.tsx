import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { HiOutlinePlus } from "react-icons/hi2"
import Badge from "../ui/Badge"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"
import QueryLoadingCard from "../ui/QueryLoadingCard"
import { useQueryErrorToast } from "../../hooks/useQueryErrorToast"
import { queryKeys } from "../../lib/queryKeys"
import { STALE_TIME } from "../../lib/queryClient"
import { unwrap } from "../../lib/unwrap"
import UserService from "../../services/UserService"
import { formatRelativeTime } from "../../utils/relativeTime"
import type { HostedLobbyItem, TournamentStatus } from "../../types/api"

type HostedStatus = TournamentStatus | "Open" | "Live" | "Ended"

const statusTone: Record<HostedStatus, "open" | "soon" | "live" | "ended"> = {
  Open: "open",
  Soon: "soon",
  Live: "live",
  Ended: "ended",
}

function hostedLobbyPath(item: HostedLobbyItem): string {
  if (item.lobbyKind === "privateRoom") {
    if (item.status === "Live") return `/versus/play/${item.id}`
    if (item.status === "Open") return `/versus/lobby/${item.id}`
    return `/versus`
  }
  return item.status === "Ended" ? `/tournament/${item.id}` : `/tournament/${item.id}/lobby`
}


const rowLinkClass =
  "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/60"

type ProfileHostedTournamentsListProps = {
  userId: string
  token: string | null
  title?: ReactNode
}

const ProfileHostedTournamentsList = ({ userId, token, title = "Hosted lobbies" }: ProfileHostedTournamentsListProps) => {
  const { data = [], isLoading, error } = useQuery({
    queryKey: queryKeys.users.hosted(userId),
    queryFn: async () => unwrap(await UserService.listHostedTournaments(token, userId)),
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
        <span className="text-muted text-sm tabular-nums">
          {isLoading ? "…" : `${data.length} hosted`}
        </span>
      </div>

      {isLoading ? (
        <QueryLoadingCard message="Loading hosted lobbies…" />
      ) : data.length === 0 ? (
        <EmptyState
          title="No hosted lobbies yet"
          description="Tournaments and private 1v1 rooms you host will show up here so you can jump back into the lobby."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/versus">
                <Button variant="secondary">Create private room</Button>
              </Link>
              <Link to="/tournament/new">
                <Button variant="primary">
                  <HiOutlinePlus className="h-4 w-4" />
                  Create a tournament
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((item) => (
            <li key={`${item.lobbyKind ?? "tournament"}-${item.id}`}>
              <Link to={hostedLobbyPath(item)} className={rowLinkClass}>
                <HostedRow item={item} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function HostedRow({ item }: { item: HostedLobbyItem }) {
  if (item.lobbyKind === "privateRoom") {
    return (
      <div className="ui-card ui-card-hover px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[item.status]} className="shrink-0">
          {item.status}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="text-sm truncate">
            <span className="font-semibold text-accent">{item.name}</span>
            <span className="text-muted"> · {item.type}</span>
          </p>
          <p className="text-xs text-muted mt-0.5 tabular-nums">
            {item.players} / {item.maxPlayers} players
            {item.passwordProtected ? " · Password" : ""}
          </p>
        </div>
        {item.status !== "Ended" ? (
          <span className="text-xs font-semibold text-highlight shrink-0">Open lobby →</span>
        ) : null}
        <span className="text-xs text-muted tabular-nums shrink-0">{formatRelativeTime(item.createdAt)}</span>
      </div>
    )
  }

  return (
    <div className="ui-card ui-card-hover px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3">
      <Badge tone={statusTone[item.status]} className="shrink-0">
        {item.status}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          <span className="font-semibold text-accent">{item.name}</span>
          <span className="text-muted"> · {item.type}</span>
        </p>
        <p className="text-xs text-muted mt-0.5 tabular-nums">
          {item.players} / {item.maxPlayers} players
          {item.visibility === "private" ? " · Private" : ""}
        </p>
      </div>
      {item.status !== "Ended" ? (
        <span className="text-xs font-semibold text-highlight shrink-0">Open lobby →</span>
      ) : null}
      <span className="text-xs text-muted tabular-nums shrink-0">{formatRelativeTime(item.createdAt)}</span>
    </div>
  )
}

export default ProfileHostedTournamentsList
