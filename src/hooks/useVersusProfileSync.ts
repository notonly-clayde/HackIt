import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/AuthContext"
import { queryKeys } from "../lib/queryKeys"
import type { VersusMatchEnded } from "../types/api"

/** Keeps auth profile stats (ELO, wins, etc.) in sync after a settled 1v1 match. */
export function useVersusProfileSync(ended: VersusMatchEnded | null) {
  const { token, profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !ended) return

    const userId = profile?.id
    if (ended.result === "abort") {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.users.history(userId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.users.hosted(userId) })
      }
      return
    }

    void refreshProfile()
    if (userId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.history(userId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.hosted(userId) })
    }
  }, [ended, token, profile?.id, refreshProfile, queryClient])
}
