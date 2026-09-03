import { useEffect, useRef } from "react"
import { useHudSoundOptional } from "../contexts/SoundContext"
import type { TournamentStatus } from "../types/api"

export function useTournamentStatusSound(status: TournamentStatus | undefined, enabled = true) {
  const { play } = useHudSoundOptional()
  const prevStatusRef = useRef(status)

  useEffect(() => {
    if (!enabled || !status) return

    if (prevStatusRef.current === "Live" && status === "Ended") {
      play("alert")
    }

    prevStatusRef.current = status
  }, [status, enabled, play])
}
