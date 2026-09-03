import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useHudSound } from "../contexts/SoundContext"
import { watchTournamentIndex } from "../services/socket"
import { queryKeys } from "../lib/queryKeys"
import type { TournamentCatalogUpdate, TournamentItem } from "../types/api"
import {
  applyCatalogUpdate,
  applyLiveStateToListItem,
  isDashboardTournament,
  sortTournamentList,
  type TournamentListFilters as LegacyFilters,
} from "../utils/tournamentList"

type DashboardOptions = { mode: "dashboard" }
type ListOptions = { mode: "list"; filters: LegacyFilters }

function patchAllTournamentLists(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (prev: TournamentItem[], filters: LegacyFilters | null) => TournamentItem[],
) {
  const entries = queryClient.getQueriesData<TournamentItem[]>({
    queryKey: queryKeys.tournaments.lists(),
  })

  for (const [key, data] of entries) {
    if (!data) continue
    const filters = (key[2] ?? {}) as { search?: string; type?: string; status?: string }
    const legacyFilters: LegacyFilters | null =
      key.length >= 3
        ? {
            search: filters.search ?? "",
            battleType:
              filters.type === "1v1" ? "single" : filters.type === "ffa" ? "ffa" : "",
            statusFilter: filters.status ?? "",
          }
        : null

    const next = updater(data, legacyFilters)
    queryClient.setQueryData(key, next)
  }
}

function patchTournamentDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  tournamentId: string,
  patch: (prev: TournamentItem) => TournamentItem,
) {
  queryClient.setQueryData<TournamentItem>(
    queryKeys.tournaments.detail(tournamentId),
    (prev) => (prev ? patch(prev) : prev),
  )
}

export function useTournamentIndexUpdates(
  token: string | null,
  options: DashboardOptions | ListOptions,
) {
  const queryClient = useQueryClient()
  const { play } = useHudSound()
  const liveAlertedRef = useRef(new Set<string>())

  useEffect(() => {
    if (!token) return

    const handleCatalog = (update: TournamentCatalogUpdate) => {
      patchAllTournamentLists(queryClient, (prev, filters) => {
        if (options.mode === "dashboard") {
          const next = applyCatalogUpdate(prev, update, { mode: "dashboard" })
          return next.filter(isDashboardTournament).slice(0, 4)
        }

        if (filters) {
          return applyCatalogUpdate(prev, update, { mode: "list", filters })
        }

        return applyCatalogUpdate(prev, update, { mode: "list", filters: { search: "", battleType: "", statusFilter: "" } })
      })

      if (update.action !== "removed" && update.tournament) {
        queryClient.setQueryData(
          queryKeys.tournaments.detail(update.tournament.id),
          update.tournament,
        )
      } else if (update.action === "removed") {
        queryClient.removeQueries({
          queryKey: queryKeys.tournaments.detail(update.tournamentId),
        })
      }
    }

    return watchTournamentIndex(token, {
      onCount: (update) => {
        patchAllTournamentLists(queryClient, (prev) =>
          prev.map((tournament) =>
            tournament.id === update.tournamentId
              ? { ...tournament, players: update.playerCount, maxPlayers: update.maxPlayers }
              : tournament,
          ),
        )
        patchTournamentDetail(queryClient, update.tournamentId, (t) => ({
          ...t,
          players: update.playerCount,
          maxPlayers: update.maxPlayers,
        }))
      },
      onCatalog: handleCatalog,
      onLiveState: (state) => {
        const prev = queryClient.getQueryData<TournamentItem>(
          queryKeys.tournaments.detail(state.tournamentId),
        )
        const wasLive = prev?.status === "Live"

        patchAllTournamentLists(queryClient, (prevList) => {
          let next = sortTournamentList(prevList.map((tournament) => applyLiveStateToListItem(tournament, state)))

          if (options.mode === "dashboard") {
            return next.filter(isDashboardTournament).slice(0, 4)
          }

          if (options.mode === "list" && options.filters.statusFilter) {
            return next.filter((tournament) => tournament.status === options.filters.statusFilter)
          }

          return next
        })

        patchTournamentDetail(queryClient, state.tournamentId, (t) =>
          applyLiveStateToListItem(t, state),
        )

        if (!wasLive && state.status === "Live" && !liveAlertedRef.current.has(state.tournamentId)) {
          liveAlertedRef.current.add(state.tournamentId)
          play("alert")
        }
      },
    })
  }, [token, queryClient, options, play])
}
