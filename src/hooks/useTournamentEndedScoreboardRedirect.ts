import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import type { TournamentStatus } from "../types/api"

export function useTournamentEndedScoreboardRedirect(
  tournamentId: string | undefined,
  status: TournamentStatus | undefined,
  options?: { skipRedirect?: boolean },
) {
  const navigate = useNavigate()
  const prevStatusRef = useRef(status)

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (options?.skipRedirect) return
    if (!tournamentId || status !== "Ended") return
    if (prevStatus !== "Live") return

    navigate(`/tournament/${tournamentId}`, { replace: true })
  }, [tournamentId, status, navigate, options?.skipRedirect])
}
