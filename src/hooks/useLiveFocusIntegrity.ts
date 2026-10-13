import { useEffect, useRef, useState } from "react"
import { useToast } from "../contexts/ToastContext"
import { reportTournamentFocusLost, reportVersusFocusLost } from "../services/socket"

/** How long focus must stay away before it counts, so brief OS popups don't trigger a penalty. */
const FOCUS_LOSS_GRACE_MS = 1000

export type FocusIntegrityTarget =
  | { mode: "tournament"; tournamentId: string }
  | { mode: "versus"; matchId: string }

/**
 * Reports to the server when the arena tab loses focus (alt-tab, tab switch, minimize)
 * while a live contest is monitored. The server applies the deduction and alerts staff.
 */
export function useLiveFocusIntegrity({
  token,
  target,
  enabled,
  paused = false,
}: {
  token: string | null
  target: FocusIntegrityTarget | null
  enabled: boolean
  paused?: boolean
}) {
  const toast = useToast()
  const [totalDeduction, setTotalDeduction] = useState(0)
  const monitoring = Boolean(enabled && token && target)
  const active = monitoring && !paused

  const mode = target?.mode
  const targetId = target ? (target.mode === "tournament" ? target.tournamentId : target.matchId) : null
  const reportedRef = useRef(false)

  useEffect(() => {
    if (!active || !token || !mode || !targetId) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const isAway = () => document.hidden || !document.hasFocus()

    const report = async () => {
      if (reportedRef.current || !isAway()) return
      reportedRef.current = true
      const ack =
        mode === "tournament"
          ? await reportTournamentFocusLost(token, targetId)
          : await reportVersusFocusLost(token, targetId)
      if (!ack.ok) return
      setTotalDeduction(ack.totalDeduction)
      if (ack.applied) {
        const unit = mode === "tournament" ? "points" : "ELO"
        toast.error(`You left the arena tab: -${ack.deduction} ${unit}. The host has been notified.`)
      }
    }

    const handleAway = () => {
      if (timer || reportedRef.current) return
      timer = setTimeout(() => {
        timer = null
        void report()
      }, FOCUS_LOSS_GRACE_MS)
    }

    const handleBack = () => {
      if (isAway()) return
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      reportedRef.current = false
    }

    const handleVisibility = () => (document.hidden ? handleAway() : handleBack())

    window.addEventListener("blur", handleAway)
    window.addEventListener("focus", handleBack)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener("blur", handleAway)
      window.removeEventListener("focus", handleBack)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [active, token, mode, targetId, toast])

  return { monitoring, totalDeduction }
}
