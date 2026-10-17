import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/AuthContext"
import {
  applyLiveStateToTournament,
  subscribeTournamentLiveState,
  subscribeTournamentProblemSetUpdate,
  subscribeTournamentStandings,
} from "../services/socket"
import { queryKeys } from "../lib/queryKeys"
import type { ProblemDetail, TournamentItem, TournamentStandings } from "../types/api"

export function useTournamentLiveStateSocket(
  token: string | null,
  tournamentId: string | undefined,
  onEnded?: () => void,
) {
  const queryClient = useQueryClient()
  const { profile, refreshProfile } = useAuth()
  const profileSyncedForEndRef = useRef(false)

  useEffect(() => {
    profileSyncedForEndRef.current = false
  }, [tournamentId])

  useEffect(() => {
    if (!token || !tournamentId) return

    return subscribeTournamentLiveState(token, (state) => {
      if (state.tournamentId !== tournamentId) return

      queryClient.setQueryData<TournamentItem>(
        queryKeys.tournaments.detail(tournamentId),
        (prev) => (prev ? applyLiveStateToTournament(prev, state) : prev),
      )

      if (state.status === "Ended") {
        if (!profileSyncedForEndRef.current) {
          profileSyncedForEndRef.current = true
          void refreshProfile()
          const userId = profile?.id
          if (userId) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.users.history(userId) })
          }
        }
        onEnded?.()
      }
    })
  }, [token, tournamentId, queryClient, onEnded, refreshProfile, profile?.id])
}

export function useTournamentProblemSetSocket(
  token: string | null,
  tournamentId: string | undefined,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !tournamentId) return

    return subscribeTournamentProblemSetUpdate(token, (update) => {
      if (update.tournamentId !== tournamentId) return

      queryClient.setQueryData(queryKeys.tournaments.problems(tournamentId), update.problems)
    })
  }, [token, tournamentId, queryClient])
}

export function useTournamentStandingsLiveSocket(
  token: string | null,
  tournamentId: string | undefined,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !tournamentId) return

    return subscribeTournamentStandings(token, (next) => {
      if (next.tournamentId !== tournamentId) return

      queryClient.setQueryData<TournamentStandings>(
        queryKeys.tournaments.standings(tournamentId),
        next,
      )
    })
  }, [token, tournamentId, queryClient])
}

export function problemsFromItems(
  items: { problem: ProblemDetail }[] | undefined,
): ProblemDetail[] {
  return (items ?? []).map((entry) => entry.problem)
}
