import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { subscribeTournamentStandings, watchTournament } from "../services/socket"
import { queryKeys } from "../lib/queryKeys"
import type { TournamentStandings } from "../types/api"

export function useTournamentStandingsSocket(
  token: string | null,
  tournamentId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !tournamentId || !enabled) return

    const unwatch = watchTournament(token, tournamentId)
    const unsubscribe = subscribeTournamentStandings(token, (next) => {
      if (next.tournamentId === tournamentId) {
        queryClient.setQueryData<TournamentStandings>(
          queryKeys.tournaments.standings(tournamentId),
          next,
        )
      }
    })

    return () => {
      unwatch()
      unsubscribe()
    }
  }, [token, tournamentId, enabled, queryClient])
}
