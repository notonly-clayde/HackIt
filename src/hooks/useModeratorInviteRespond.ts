import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { queryKeys } from "../lib/queryKeys"
import TournamentService from "../services/TournamentService"

export function useModeratorInviteRespond() {
  const { token } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  return useCallback(
    async (tournamentId: string, accept: boolean) => {
      const [, err] = await TournamentService.respondModeratorInvite(token, tournamentId, accept)
      if (err) {
        if (!accept && err.toLowerCase().includes("no pending moderator invite")) {
          queryClient.setQueryData(
            queryKeys.tournaments.detail(tournamentId),
            (prev: { viewerModeratorInvitePending?: boolean } | undefined) =>
              prev ? { ...prev, viewerModeratorInvitePending: false } : prev,
          )
          void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.moderatorInvites() })
          return true
        }
        toast.error(err)
        return false
      }

      queryClient.setQueryData(
        queryKeys.tournaments.detail(tournamentId),
        (prev: { viewerModeratorInvitePending?: boolean } | undefined) =>
          prev ? { ...prev, viewerModeratorInvitePending: false } : prev,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.moderatorInvites() })

      if (accept) {
        toast.success("You accepted the moderator role")
      } else {
        toast.success("Moderator invite declined")
      }
      return true
    },
    [queryClient, token, toast],
  )
}
