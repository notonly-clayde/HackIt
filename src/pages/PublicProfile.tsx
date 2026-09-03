import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import ReportButton from "../components/moderation/ReportButton"
import { useAuth } from "../contexts/AuthContext"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import { unwrap } from "../lib/unwrap"
import UserService from "../services/UserService"
import { STALE_TIME } from "../lib/queryClient"

const PublicProfile = () => {
  const { id } = useParams()
  const { token, profile } = useAuth()
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.users.public(id ?? ""),
    queryFn: async () => unwrap(await UserService.getPublic(token, id!)),
    enabled: Boolean(id) && Boolean(token),
    staleTime: STALE_TIME.detail,
  })
  useQueryErrorToast(error)

  if (isLoading && !data) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading profile…" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Profile unavailable"
          description={error?.message}
          action={
            <Link to="/">
              <Button variant="secondary">Home</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isSelf = profile?.id === data.id

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to="/" className="text-sm text-muted hover:text-highlight">
        ← Home
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary/40 text-xl font-bold text-accent">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              data.displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <p className="ui-kicker mb-1">Player</p>
            <h1 className="text-2xl font-bold tracking-tight text-accent sm:text-3xl">{data.displayName}</h1>
            {data.bio ? <p className="mt-2 max-w-xl text-sm text-muted">{data.bio}</p> : null}
          </div>
        </div>
        {!isSelf && <ReportButton targetType="user" targetId={data.id} variant="secondary" />}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "1v1 ELO", value: data.elo1v1 },
          { label: "Tournament ELO", value: data.eloTournament },
          { label: "Wins", value: data.wins },
          { label: "Matches", value: data.matchCount },
        ].map((stat) => (
          <Card key={stat.label} className="px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-accent tabular-nums">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PublicProfile
