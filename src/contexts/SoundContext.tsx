import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  DEFAULT_VOLUME,
  playHudCue,
  prefersReducedMotion,
  STORAGE_KEYS,
  unlockHudAudio,
  type HudSoundCue,
} from "../lib/hudSound"
import { useGlobalHudHoverSound } from "../hooks/useGlobalHudHoverSound"

type SoundContextValue = {
  enabled: boolean
  volume: number
  play: (cue: HudSoundCue) => void
  setEnabled: (next: boolean) => void
  toggleEnabled: () => void
  setVolume: (next: number) => void
  unlock: () => Promise<void>
}

const SoundContext = createContext<SoundContextValue | null>(null)

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return false
  if (prefersReducedMotion()) return false

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.enabled)
    return raw === "true"
  } catch {
    return false
  }
}

function readStoredVolume(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.volume)
    if (!raw) return DEFAULT_VOLUME
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_VOLUME
  } catch {
    return DEFAULT_VOLUME
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readStoredEnabled)
  const [volume, setVolumeState] = useState(readStoredVolume)

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next)
    try {
      localStorage.setItem(STORAGE_KEYS.enabled, String(next))
    } catch {
      /* ignore */
    }
  }, [])

  const setVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next))
    setVolumeState(clamped)
    try {
      localStorage.setItem(STORAGE_KEYS.volume, String(clamped))
    } catch {
      /* ignore */
    }
  }, [])

  const unlock = useCallback(async () => {
    await unlockHudAudio()
  }, [])

  const play = useCallback(
    (cue: HudSoundCue) => {
      if (!enabled) return
      playHudCue(cue, volume)
    },
    [enabled, volume],
  )

  useGlobalHudHoverSound(enabled, play)

  const toggleEnabled = useCallback(async () => {
    const next = !enabled
    if (next) {
      await unlockHudAudio()
      setEnabled(true)
      playHudCue("confirm", volume)
      return
    }
    setEnabled(false)
  }, [enabled, setEnabled, volume])

  useEffect(() => {
    if (!enabled) return
    void unlockHudAudio()
  }, [enabled])

  const value = useMemo(
    () => ({
      enabled,
      volume,
      play,
      setEnabled,
      toggleEnabled,
      setVolume,
      unlock,
    }),
    [enabled, volume, play, setEnabled, toggleEnabled, setVolume, unlock],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useHudSound(): SoundContextValue {
  const ctx = useContext(SoundContext)
  if (!ctx) {
    throw new Error("useHudSound must be used within SoundProvider")
  }
  return ctx
}

/** Safe no-op when SoundProvider is absent (e.g. tests). */
export function useHudSoundOptional(): Pick<SoundContextValue, "play" | "enabled" | "toggleEnabled" | "unlock"> {
  const ctx = useContext(SoundContext)
  return useMemo(
    () =>
      ctx ?? {
        enabled: false,
        play: () => {},
        toggleEnabled: async () => {},
        unlock: async () => {},
      },
    [ctx],
  )
}
