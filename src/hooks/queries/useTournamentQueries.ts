import { useQuery, useQueryClient, keepPreviousData, type QueryClient } from "@tanstack/react-query"
import TournamentService from "../../services/TournamentService"
import { queryKeys, type TournamentListFilters } from "../../lib/queryKeys"
import { STALE_TIME } from "../../lib/queryClient"
import { unwrap } from "../../lib/unwrap"
import type { TournamentItem } from "../../types/api"
import { isDashboardTournament, sortTournamentList } from "../../utils/tournamentList"

export async function fetchTournamentListData(filters: TournamentListFilters = {}) {
  const tournaments = unwrap(await TournamentService.list(filters))
  return sortTournamentList(tournaments)
}

export function useTournamentList(filters: TournamentListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tournaments.list(filters),
    queryFn: () => fetchTournamentListData(filters),
    staleTime: STALE_TIME.catalog,
    placeholderData: keepPreviousData,
  })
}

export function useDashboardTournaments() {
  const query = useTournamentList({})

  const upcoming =
    query.data?.filter(isDashboardTournament).slice(0, 4) ?? []

  return { ...query, upcoming }
}

export function useTournamentDetail(id: string | undefined, token: string | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.tournaments.detail(id ?? ""),
    queryFn: async () => unwrap(await TournamentService.getById(id!, token)),
    enabled: Boolean(id),
    staleTime: STALE_TIME.detail,
    placeholderData: () => {
      if (!id) return undefined
      const lists = queryClient.getQueriesData<TournamentItem[]>({
        queryKey: queryKeys.tournaments.lists(),
      })
      for (const [, data] of lists) {
        const found = data?.find((t) => t.id === id)
        if (found) return found
      }
      return undefined
    },
  })
}

export function useTournamentStandings(
  id: string | undefined,
  token: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.tournaments.standings(id ?? ""),
    queryFn: async () => unwrap(await TournamentService.getStandings(id!, token)),
    enabled: Boolean(id) && enabled,
    staleTime: STALE_TIME.live,
    placeholderData: keepPreviousData,
  })
}

export function useTournamentProblems(
  id: string | undefined,
  token: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.tournaments.problems(id ?? ""),
    queryFn: async () => unwrap(await TournamentService.listProblems(token, id!)),
    enabled: Boolean(id) && Boolean(token) && enabled,
    staleTime: STALE_TIME.live,
    placeholderData: keepPreviousData,
  })
}

export function prefetchTournamentList(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.tournaments.list({}),
    queryFn: () => fetchTournamentListData({}),
    staleTime: STALE_TIME.catalog,
  })
}

export function prefetchTournamentDetail(
  queryClient: QueryClient,
  id: string,
  token: string | null,
) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.tournaments.detail(id),
    queryFn: async () => unwrap(await TournamentService.getById(id, token)),
    staleTime: STALE_TIME.detail,
  })
}

export function prefetchTournamentStandings(
  queryClient: QueryClient,
  id: string,
  token: string | null,
) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.tournaments.standings(id),
    queryFn: async () => unwrap(await TournamentService.getStandings(id, token)),
    staleTime: STALE_TIME.live,
  })
}
