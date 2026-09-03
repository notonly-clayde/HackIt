import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Blocks browser back and tab close while `enabled`, and exposes a confirm flow
 * for intentional leave actions (e.g. the arena back button).
 */
export function useForfeitLeaveGuard(enabled: boolean) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
    if (!enabled) {
      setConfirmOpen(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    // Trap browser back: push a guard entry, then re-push and prompt on popstate.
    window.history.pushState({ versusLeaveGuard: true }, "")

    const onPopState = () => {
      if (!enabledRef.current) return
      window.history.pushState({ versusLeaveGuard: true }, "")
      setConfirmOpen(true)
    }

    window.addEventListener("popstate", onPopState)
    return () => {
      window.removeEventListener("popstate", onPopState)
    }
  }, [enabled])

  const requestLeave = useCallback(() => {
    if (!enabledRef.current) return
    setConfirmOpen(true)
  }, [])

  const cancelLeave = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  const confirmLeave = useCallback(() => {
    setConfirmOpen(false)
    enabledRef.current = false
  }, [])

  return {
    confirmOpen,
    requestLeave,
    cancelLeave,
    confirmLeave,
  }
}
