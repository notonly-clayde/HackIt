import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineFlag,
  HiOutlineListBullet,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineSquares2X2,
  HiOutlineTrash,
  HiOutlineUserPlus,
} from "react-icons/hi2"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import SectionHeader from "../components/ui/SectionHeader"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import Select from "../components/ui/Select"
import KebabMenu from "../components/ui/KebabMenu"
import TournamentService from "../services/TournamentService"
import { useHudSound } from "../contexts/SoundContext"
import { useToast } from "../contexts/ToastContext"
import { useConfirm } from "../contexts/ConfirmContext"
import { queryKeys } from "../lib/queryKeys"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { useTournamentIndexUpdates } from "../hooks/useTournamentIndexUpdates"
import {
  prefetchTournamentDetail,
  prefetchTournamentStandings,
  useTournamentList,
} from "../hooks/queries/useTournamentQueries"
import { useAuth } from "../contexts/AuthContext"
import type { TournamentItem, TournamentStatus } from "../types/api"

const VIEW_STORAGE_KEY = "hackit.tournamentView"

type TournamentView = "list" | "card"

const statusTone: Record<TournamentStatus, "open" | "soon" | "live" | "ended"> = {
  Open: "open",
  Soon: "soon",
  Live: "live",
  Ended: "ended",
}

const statusOptions = [
  { value: "", label: "All status" },
  { value: "Open", label: "Open" },
  { value: "Soon", label: "Soon" },
  { value: "Live", label: "Live" },
  { value: "Ended", label: "Ended" },
]

function readStoredView(): TournamentView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "card" ? "card" : "list"
  } catch {
    return "list"
  }
}

const TournamentActions = ({ tournament }: { tournament: TournamentItem }) => {
  const { play } = useHudSound()

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Link to={`/tournament/${tournament.id}`} className="inline-flex">
        <Button variant="secondary">
          <HiOutlineEye className="h-4 w-4" />
          Inspect
        </Button>
      </Link>
      {tournament.status === "Open" && (
        <Link to={`/tournament/${tournament.id}/lobby`} className="inline-flex" onClick={() => play("link")}>
          <Button variant="primary" sound={false}>
            <HiOutlineUserPlus className="h-4 w-4" />
            Join lobby
          </Button>
        </Link>
      )}
      {tournament.status === "Live" && (
        <Link to={`/tournament/${tournament.id}/spectate`} className="inline-flex">
          <Button variant="primary">
            <HiOutlineEye className="h-4 w-4" />
            Spectate
          </Button>
        </Link>
      )}
      {tournament.status === "Ended" && (
        <Link to={`/tournament/${tournament.id}`} className="inline-flex">
          <Button variant="ghost">
            <HiOutlineChartBar className="h-4 w-4" />
            Results
          </Button>
        </Link>
      )}
    </div>
  )
}

const TournamentHostMenu = ({ tournament }: { tournament: TournamentItem }) => {
  const { token, profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [deleting, setDeleting] = useState(false)

  const editable = tournament.status === "Open" || tournament.status === "Soon"
  if (!profile || tournament.hostId !== profile.id || !editable) return null

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete tournament",
      message: `Delete "${tournament.name}"? Players in the lobby will be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    })
    if (!ok) return

    setDeleting(true)
    const [, err] = await TournamentService.remove(token, tournament.id)
    setDeleting(false)

    if (err) {
      toast.error(err)
      return
    }

    queryClient.removeQueries({ queryKey: queryKeys.tournaments.detail(tournament.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.lists() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.hostedAll() })
    toast.success("Tournament deleted")
  }

  return (
    <KebabMenu
      aria-label={`Options for ${tournament.name}`}
      items={[
        {
          label: "Edit",
          icon: <HiOutlinePencilSquare className="h-4 w-4" />,
          onSelect: () => navigate(`/tournament/${tournament.id}/edit`, { state: { from: "list" } }),
          disabled: deleting,
        },
        {
          label: deleting ? "Deleting…" : "Delete",
          icon: <HiOutlineTrash className="h-4 w-4" />,
          onSelect: () => void handleDelete(),
          danger: true,
          disabled: deleting,
        },
      ]}
    />
  )
}

const Tournament = () => {
  const { token } = useAuth()
  const { play } = useHudSound()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [view, setView] = useState<TournamentView>(readStoredView)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), search.trim() ? 250 : 0)
    return () => window.clearTimeout(timeout)
  }, [search])

  const setAndStoreView = (next: TournamentView) => {
    if (next !== view) play("toggle")
    setView(next)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      /* ignore quota / private mode */
    }
  }

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: (statusFilter as TournamentStatus) || undefined,
    }),
    [debouncedSearch, statusFilter],
  )

  const { data: tournaments = [], isLoading, isFetching, error } = useTournamentList(filters)
  useQueryErrorToast(error)

  const indexOptions = useMemo(
    () => ({
      mode: "list" as const,
      filters: { search, battleType: "", statusFilter },
    }),
    [search, statusFilter],
  )

  useTournamentIndexUpdates(token, indexOptions)

  const prefetchTournament = (id: string, status: TournamentStatus) => {
    void prefetchTournamentDetail(queryClient, id, token)
    if (status === "Live" || status === "Ended") {
      void prefetchTournamentStandings(queryClient, id, token)
    }
  }

  return (
    <div className="page-container mt-8 sm:mt-10">
      <SectionHeader
        kicker="Compete"
        title="Tournaments"
        description="Browse open, scheduled, live, and ended events."
        action={
          <Link to="/tournament/new">
            <Button variant="primary">
              <HiOutlineFlag className="h-4 w-4" />
              Host tournament
            </Button>
          </Link>
        }
        className="mb-6"
      />

      <div className="flex flex-col gap-3 md:flex-row mb-8">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments..."
            className="ui-input pl-10 pr-4"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          className="w-full md:w-44 md:flex-none"
          aria-label="Status"
          icon={<HiOutlineClock className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-l-2 border-highlight/40 pl-3">
        <h2 className="text-accent font-semibold text-lg tracking-tight">Available lobbies</h2>
        <div className="flex items-center gap-3">
          <RefreshingIndicator show={isFetching && !isLoading} />
          <span className="text-muted text-sm tabular-nums">
            {tournaments.length} tournament{tournaments.length === 1 ? "" : "s"}
          </span>
          <div className="ui-view-toggle" role="group" aria-label="Tournament view">
            <button
              type="button"
              aria-pressed={view === "list"}
              aria-label="List view"
              title="List view"
              onClick={() => setAndStoreView("list")}
            >
              <HiOutlineListBullet className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-pressed={view === "card"}
              aria-label="Card view"
              title="Card view"
              onClick={() => setAndStoreView("card")}
            >
              <HiOutlineSquares2X2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && tournaments.length === 0 ? (
        <QueryLoadingCard message="Loading tournaments…" />
      ) : error ? (
        <EmptyState title="Could not load tournaments" description={error.message} />
      ) : tournaments.length === 0 ? (
        <EmptyState title="No tournaments found" description="Try a different search, type, or status." />
      ) : view === "card" ? (
        <div key="card" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 hud-stagger">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              hover
              className="flex h-full flex-col px-5 py-5"
              onMouseEnter={() => prefetchTournament(tournament.id, tournament.status)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-accent font-semibold text-lg tracking-tight min-w-0">{tournament.name}</h3>
                  <Badge tone={statusTone[tournament.status]}>{tournament.status}</Badge>
                  {tournament.visibility === "private" && <Badge tone="neutral">Private</Badge>}
                </div>
                <TournamentHostMenu tournament={tournament} />
              </div>
              <p className="text-muted text-sm mt-2">
                {tournament.type} · {tournament.date} · {tournament.duration}
              </p>
              <p className="text-accent/80 text-sm mt-2 leading-relaxed line-clamp-3 flex-1">
                {tournament.description}
              </p>
              <p className="text-muted text-xs sm:text-sm mt-4 tabular-nums">
                Host {tournament.host} · {tournament.players}/{tournament.maxPlayers} players
              </p>
              <div className="mt-4">
                <TournamentActions tournament={tournament} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div key="list" className="flex flex-col gap-3 hud-stagger">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              hover
              className="px-5 sm:px-6 py-5"
              onMouseEnter={() => prefetchTournament(tournament.id, tournament.status)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-accent font-semibold text-lg truncate tracking-tight">{tournament.name}</h3>
                    <Badge tone={statusTone[tournament.status]}>{tournament.status}</Badge>
                    {tournament.visibility === "private" && <Badge tone="neutral">Private</Badge>}
                  </div>
                  <p className="text-muted text-sm mt-1">
                    {tournament.type} · {tournament.date} · {tournament.duration} · Host {tournament.host}
                  </p>
                  <p className="text-accent/80 text-sm mt-2 leading-relaxed max-w-2xl">{tournament.description}</p>
                  <p className="text-muted text-xs sm:text-sm mt-3 tabular-nums">
                    {tournament.players}/{tournament.maxPlayers} players joined
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TournamentActions tournament={tournament} />
                  <TournamentHostMenu tournament={tournament} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Tournament
