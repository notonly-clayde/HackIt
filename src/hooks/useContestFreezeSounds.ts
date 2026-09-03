import { useEffect, useRef } from "react"
import { useHudSoundOptional } from "../contexts/SoundContext"

export function useContestFreezeSounds(
  contestFrozen: boolean,
  resumeCountdownSeconds: number | null,
  enabled = true,
) {
  const { play } = useHudSoundOptional()
  const prevContestFrozenRef = useRef(contestFrozen)
  const prevResumeCountdownRef = useRef(resumeCountdownSeconds)

  useEffect(() => {
    if (!enabled) return

    const wasFrozen = prevContestFrozenRef.current
    const hadCountdown = prevResumeCountdownRef.current != null
    const hasCountdown = resumeCountdownSeconds != null

    if (contestFrozen && !wasFrozen && !hasCountdown) {
      play("alert")
    }

    if (hasCountdown && !hadCountdown) {
      play("scan")
    }

    if (
      hasCountdown &&
      resumeCountdownSeconds != null &&
      resumeCountdownSeconds > 0 &&
      prevResumeCountdownRef.current != null &&
      resumeCountdownSeconds < prevResumeCountdownRef.current
    ) {
      play("tap")
    }

    prevContestFrozenRef.current = contestFrozen
    prevResumeCountdownRef.current = resumeCountdownSeconds
  }, [contestFrozen, resumeCountdownSeconds, enabled, play])
}
