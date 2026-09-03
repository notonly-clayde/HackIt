import { useEffect, useRef } from "react"
import { useHudSoundOptional } from "../contexts/SoundContext"
import { useTournamentTimer } from "./useTournamentTimer"
import type { TournamentTimerFields } from "../types/api"

const URGENCY_THRESHOLD_SECONDS = 10

export function useTournamentUrgencySound(fields: TournamentTimerFields | undefined, enabled = true) {
  const { play } = useHudSoundOptional()
  const { remainingMs, isPaused, isEnded, isActive } = useTournamentTimer(fields ?? { status: "Open", durationMinutes: 0 })
  const prevSecondsRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !fields || !isActive || isPaused || isEnded || remainingMs == null) {
      prevSecondsRef.current = null
      return
    }

    const secondsLeft = Math.ceil(remainingMs / 1000)

    if (secondsLeft > URGENCY_THRESHOLD_SECONDS || secondsLeft <= 0) {
      prevSecondsRef.current = secondsLeft
      return
    }

    if (prevSecondsRef.current !== secondsLeft) {
      play("urgency")
      prevSecondsRef.current = secondsLeft
    }
  }, [enabled, fields, isActive, isPaused, isEnded, remainingMs, play])
}
