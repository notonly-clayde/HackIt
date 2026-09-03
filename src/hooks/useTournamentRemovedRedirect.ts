import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"
import { subscribeTournamentCatalog } from "../services/socket"
import { queryKeys } from "../lib/queryKeys"

export function isTournamentMissingMessage(message: string) {
  return message.toLowerCase().includes("tournament not found")
}

type Options = {
  onRemoved?: () => void
}

export function useTournamentRemovedRedirect(
  tournamentId: string | undefined,
  token: string | null,
  queryError: Error | null | undefined,
  options?: Options,
) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const handledRef = useRef(false)
  const onRemovedRef = useRef(options?.onRemoved)

  onRemovedRef.current = options?.onRemoved

  const redirectRemoved = useCallback(
    (message: string) => {
      if (!tournamentId || handledRef.current) return
      handledRef.current = true

      queryClient.removeQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) })
      queryClient.removeQueries({ queryKey: queryKeys.tournaments.problems(tournamentId) })
      queryClient.removeQueries({ queryKey: queryKeys.tournaments.standings(tournamentId) })

      onRemovedRef.current?.()
      toast.info(message)
      navigate("/tournament", { replace: true })
    },
    [navigate, queryClient, toast, tournamentId],
  )

  useEffect(() => {
    if (!token || !tournamentId) return

    return subscribeTournamentCatalog(token, (update) => {
      if (update.action === "removed" && update.tournamentId === tournamentId) {
        redirectRemoved("This tournament was deleted by the host.")
      }
    })
  }, [token, tournamentId, redirectRemoved])

  useEffect(() => {
    if (!queryError || !isTournamentMissingMessage(queryError.message)) return
    redirectRemoved("This tournament is no longer available.")
  }, [queryError, redirectRemoved])

  useEffect(() => {
    if (!queryError || isTournamentMissingMessage(queryError.message)) return
    toast.error(queryError.message)
  }, [queryError, toast])
}
