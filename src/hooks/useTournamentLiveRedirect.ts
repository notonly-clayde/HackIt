import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { watchTournament } from "../services/socket"
import { useTournamentLiveStateSocket } from "./useTournamentLiveSockets"
import type { TournamentItem } from "../types/api"

export function useTournamentLiveRedirect(token: string | null, tournament: TournamentItem | undefined) {
  const navigate = useNavigate()
  const id = tournament?.id
  const status = tournament?.status
  const viewerRole = tournament?.viewerRole
  const involved = viewerRole === "host" || viewerRole === "player" || viewerRole === "mod"
  const waiting = status === "Open" || status === "Soon"

  useEffect(() => {
    if (!token || !id || !involved || !waiting) return
    return watchTournament(token, id)
  }, [token, id, involved, waiting])

  useTournamentLiveStateSocket(token, involved ? id : undefined)

  const prevStatusRef = useRef(status)

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status
    if (!id || status !== "Live" || (prevStatus !== "Open" && prevStatus !== "Soon")) return

    if (viewerRole === "host") {
      navigate(`/tournament/${id}/spectate`)
    } else if (viewerRole === "player" || viewerRole === "mod") {
      navigate(`/tournament/${id}/play`)
    }
  }, [id, status, viewerRole, navigate])
}
