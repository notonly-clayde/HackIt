import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { watchLobbyIndex } from "../services/socket"
import { queryKeys } from "../lib/queryKeys"
import type { LobbyCountUpdate, TournamentItem } from "../types/api"

export function useLobbyIndexCounts(token: string | null, tournamentId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    return watchLobbyIndex(token, (update: LobbyCountUpdate) => {
      if (tournamentId && update.tournamentId !== tournamentId) return

      queryClient.setQueryData<TournamentItem>(
        queryKeys.tournaments.detail(update.tournamentId),
        (prev) =>
          prev
            ? { ...prev, players: update.playerCount, maxPlayers: update.maxPlayers }
            : prev,
      )

      const entries = queryClient.getQueriesData<TournamentItem[]>({
        queryKey: queryKeys.tournaments.lists(),
      })
      for (const [key, data] of entries) {
        if (!data) continue
        queryClient.setQueryData(
          key,
          data.map((tournament) =>
            tournament.id === update.tournamentId
              ? { ...tournament, players: update.playerCount, maxPlayers: update.maxPlayers }
              : tournament,
          ),
        )
      }
    })
  }, [token, tournamentId, queryClient])
}
