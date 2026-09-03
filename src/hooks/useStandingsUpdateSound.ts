import { useEffect, useRef } from "react"
import { useHudSoundOptional } from "../contexts/SoundContext"
import type { TournamentStandings } from "../types/api"

function standingsFingerprint(standings: TournamentStandings): string {
  return standings.entries
    .map((entry) => `${entry.userId}:${entry.rank}:${entry.score}`)
    .join("|")
}

export function useStandingsUpdateSound(standings: TournamentStandings | null, enabled = true) {
  const { play } = useHudSoundOptional()
  const prevFingerprintRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !standings) return

    const fingerprint = standingsFingerprint(standings)

    if (prevFingerprintRef.current !== null && prevFingerprintRef.current !== fingerprint) {
      play("transmit")
    }

    prevFingerprintRef.current = fingerprint
  }, [standings, enabled, play])
}
