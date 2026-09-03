import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { HiOutlineBolt, HiOutlineEye, HiOutlineFlag, HiOutlineTrophy } from "react-icons/hi2"
import { useAuth } from "../contexts/AuthContext"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import SectionHeader from "../components/ui/SectionHeader"
import EmptyState from "../components/ui/EmptyState"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import { useTournamentIndexUpdates } from "../hooks/useTournamentIndexUpdates"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { useDashboardTournaments, prefetchTournamentList } from "../hooks/queries/useTournamentQueries"
import { prefetchProblemCatalog } from "../hooks/queries/useProblemQueries"

const dashboardIndexOptions = { mode: "dashboard" as const }

const quickActions = [
  {
    title: "Tournaments",
    description: "Browse open lobbies, join free-for-alls, or host your own event with mods and spectators.",
    to: "/tournament",
    cta: "Browse Tournaments",
    icon: <HiOutlineTrophy className="h-7 w-7" />,
  },
  {
    title: "Versus",
    description: "Find a 1v1 match or create a private room. Wins raise your 1v1 ELO; losses lower it.",
    to: "/versus",
    cta: "Start a Battle",
    icon: <HiOutlineBolt className="h-7 w-7" />,
  },
]

const statusTone = {
  Open: "open" as const,
  Soon: "soon" as const,
  Live: "live" as const,
  Ended: "ended" as const,
}

const Dashboard = () => {
  const { user, profile, token } = useAuth()
  const queryClient = useQueryClient()
  const displayName =
    profile?.displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Coder"

  const { upcoming, isLoading, isFetching, error } = useDashboardTournaments()
  useQueryErrorToast(error)

  useTournamentIndexUpdates(token, dashboardIndexOptions)

  useEffect(() => {
    void prefetchTournamentList(queryClient)
    void prefetchProblemCatalog(queryClient, token)
  }, [queryClient, token])

  return (
    <div className="page-container mt-8 sm:mt-10">
      <SectionHeader
        kicker="Ops desk"
        title={`Welcome back, ${displayName}`}
        description="Jump into a tournament lobby or challenge someone to a versus battle."
        action={
          <Link to="/tournament/new">
            <Button variant="primary">
              <HiOutlineFlag className="h-4 w-4" />
              Host tournament
            </Button>
          </Link>
        }
        className="mb-8 sm:mb-10"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-12">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.to} className="group">
            <Card hover className="p-6 sm:p-7 h-full">
              <div className="ui-icon-box mb-4 !h-12 !w-12">{action.icon}</div>
              <h2 className="text-accent font-bold text-xl mb-2 tracking-tight">{action.title}</h2>
              <p className="text-muted text-sm leading-relaxed mb-5">{action.description}</p>
              <span className="inline-flex text-sm font-semibold text-highlight group-hover:underline">
                {action.cta} →
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5 border-l-2 border-highlight/40 pl-3">
        <h2 className="text-accent font-bold text-xl sm:text-2xl tracking-tight">Match board</h2>
        <div className="flex items-center gap-3">
          <RefreshingIndicator show={isFetching && !isLoading} />
          <Link to="/tournament" className="text-highlight text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
      </div>

      {isLoading && upcoming.length === 0 ? (
        <QueryLoadingCard message="Loading match board…" />
      ) : error ? (
        <EmptyState title="Could not load tournaments" description={error.message} />
      ) : upcoming.length === 0 ? (
        <EmptyState
          title="No open events yet"
          description="Host a tournament or check back later."
          action={
            <Link to="/tournament/new">
              <Button variant="primary">
                <HiOutlineFlag className="h-4 w-4" />
                Host tournament
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {upcoming.map((tournament) => (
            <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
              <Card hover className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-accent font-semibold truncate">{tournament.name}</h3>
                    <Badge tone={statusTone[tournament.status]}>{tournament.status}</Badge>
                  </div>
                  <p className="text-muted text-sm mt-1">
                    {tournament.type} · {tournament.date} · {tournament.players}/{tournament.maxPlayers} players
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-highlight text-sm font-medium shrink-0">
                  <HiOutlineEye className="h-4 w-4" />
                  Inspect
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
