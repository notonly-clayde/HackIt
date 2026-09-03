import type { TournamentCatalogUpdate, TournamentItem, TournamentStatus } from "../types/api"

export type TournamentListFilters = {
  search: string
  battleType: string
  statusFilter: string
}

export function matchesTournamentFilters(
  tournament: TournamentItem,
  filters: TournamentListFilters,
): boolean {
  const query = filters.search.trim().toLowerCase()
  if (query) {
    const haystack = `${tournament.name} ${tournament.description} ${tournament.host}`.toLowerCase()
    if (!haystack.includes(query)) return false
  }

  if (filters.battleType === "single" && tournament.type !== "1v1 Match") return false
  if (filters.battleType === "ffa" && tournament.type !== "Free For All") return false
  if (filters.statusFilter && tournament.status !== filters.statusFilter) return false

  return true
}

export function isDashboardTournament(tournament: TournamentItem): boolean {
  return tournament.status === "Open" || tournament.status === "Soon" || tournament.status === "Live"
}

const STATUS_RANK: Record<TournamentStatus, number> = {
  Live: 0,
  Open: 1,
  Soon: 2,
  Ended: 3,
}

function compareIsoTime(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: "asc" | "desc",
): number {
  const aTime = a ? Date.parse(a) : 0
  const bTime = b ? Date.parse(b) : 0
  return direction === "asc" ? aTime - bTime : bTime - aTime
}

function compareTournamentListItems(a: TournamentItem, b: TournamentItem): number {
  const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
  if (statusDiff !== 0) return statusDiff

  let timeDiff = 0
  if (a.status === "Live") {
    timeDiff = compareIsoTime(a.liveStartedAt, b.liveStartedAt, "desc")
  } else if (a.status === "Ended") {
    timeDiff = compareIsoTime(a.endedAt, b.endedAt, "desc")
  } else {
    timeDiff = compareIsoTime(a.scheduledAt, b.scheduledAt, "asc")
  }

  if (timeDiff !== 0) return timeDiff
  return a.name.localeCompare(b.name)
}

export function sortTournamentList(items: TournamentItem[]): TournamentItem[] {
  return [...items].sort(compareTournamentListItems)
}

export function applyCatalogUpdate(
  tournaments: TournamentItem[],
  update: TournamentCatalogUpdate,
  options:
    | { mode: "dashboard" }
    | { mode: "list"; filters: TournamentListFilters },
): TournamentItem[] {
  if (update.action === "removed") {
    const filtered = tournaments.filter((tournament) => tournament.id !== update.tournamentId)
    if (options.mode === "dashboard") {
      return sortTournamentList(filtered).filter(isDashboardTournament).slice(0, 4)
    }
    return sortTournamentList(filtered)
  }

  const tournament = update.tournament

  if (options.mode === "dashboard") {
    let updated = tournaments.filter((item) => item.id !== tournament.id)
    if (isDashboardTournament(tournament)) {
      updated = [...updated, tournament]
    }
    return sortTournamentList(updated).filter(isDashboardTournament).slice(0, 4)
  }

  const { filters } = options
  const matches = matchesTournamentFilters(tournament, filters)
  const existingIndex = tournaments.findIndex((item) => item.id === tournament.id)

  if (!matches) {
    if (existingIndex === -1) return tournaments
    return sortTournamentList(tournaments.filter((item) => item.id !== tournament.id))
  }

  let updated: TournamentItem[]
  if (existingIndex === -1) {
    updated = update.action === "created" ? [...tournaments, tournament] : tournaments
  } else {
    updated = tournaments.map((item) => (item.id === tournament.id ? tournament : item))
  }

  return sortTournamentList(updated)
}

export function applyLiveStateToListItem(
  tournament: TournamentItem,
  state: {
    tournamentId: string
    status: TournamentStatus
    liveStartedAt: string | null
    pausedAt: string | null
    resumeAt: string | null
    pausedTotalMs: number
    endedAt: string | null
    durationMinutes: number
  },
): TournamentItem {
  if (tournament.id !== state.tournamentId) return tournament

  return {
    ...tournament,
    status: state.status,
    date: state.status === "Live" ? "Today · Ongoing" : tournament.date,
    liveStartedAt: state.liveStartedAt,
    pausedAt: state.pausedAt,
    resumeAt: state.resumeAt,
    pausedTotalMs: state.pausedTotalMs,
    endedAt: state.endedAt,
    durationMinutes: state.durationMinutes,
    duration: `${state.durationMinutes} min`,
  }
}
