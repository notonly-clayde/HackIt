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
import type { TournamentItem, TournamentStatus } from "../../types/api"

const statusTone: Record<TournamentStatus, "open" | "soon" | "live" | "ended"> = {
  Open: "open",
  Soon: "soon",
  Live: "live",
  Ended: "ended",
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
          description="Tournaments you host will show up here so you can jump back into the lobby."
          action={
            <Link to="/tournament/new">
              <Button variant="primary">
                <HiOutlinePlus className="h-4 w-4" />
                Create a tournament
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((tournament) => (
            <li key={tournament.id}>
              <Link
                to={tournament.status === "Ended" ? `/tournament/${tournament.id}` : `/tournament/${tournament.id}/lobby`}
                className={rowLinkClass}
              >
                <HostedRow tournament={tournament} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function HostedRow({ tournament }: { tournament: TournamentItem }) {
  return (
    <div className="ui-card ui-card-hover px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3">
      <Badge tone={statusTone[tournament.status]} className="shrink-0">
        {tournament.status}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          <span className="font-semibold text-accent">{tournament.name}</span>
          <span className="text-muted"> · {tournament.type}</span>
        </p>
        <p className="text-xs text-muted mt-0.5 tabular-nums">
          {tournament.players} / {tournament.maxPlayers} players
          {tournament.visibility === "private" ? " · Private" : ""}
        </p>
      </div>
      {tournament.status !== "Ended" ? (
        <span className="text-xs font-semibold text-highlight shrink-0">Open lobby →</span>
      ) : null}
      <span className="text-xs text-muted tabular-nums shrink-0">{formatRelativeTime(tournament.createdAt)}</span>
    </div>
  )
}

export default ProfileHostedTournamentsList
