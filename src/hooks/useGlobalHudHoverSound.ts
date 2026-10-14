import { useEffect } from "react"
import { findHoverTarget } from "../lib/hudHoverTarget"
import type { HudSoundCue } from "../lib/hudSound"

export function useGlobalHudHoverSound(enabled: boolean, play: (cue: HudSoundCue) => void) {
  useEffect(() => {
    if (!enabled) return

    let lastTarget: Element | null = null

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return
      const target = findHoverTarget(event.target)
      if (target === lastTarget) return
      lastTarget = target
      if (target) play("tap")
    }

    document.addEventListener("pointerover", onPointerOver, { passive: true })
    return () => document.removeEventListener("pointerover", onPointerOver)
  }, [enabled, play])
}
