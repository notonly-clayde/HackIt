import { useEffect, useMemo, useState } from "react"
import type { TournamentTimerFields } from "../types/api"

export function computeRemainingMs(fields: TournamentTimerFields, now = Date.now()): number | null {
  if (!fields.liveStartedAt || fields.status === "Open" || fields.status === "Soon") {
    return null
  }

  const started = new Date(fields.liveStartedAt).getTime()
  const endReference = fields.endedAt ? new Date(fields.endedAt).getTime() : now
  const pauseTail =
    fields.pausedAt && !fields.endedAt
      ? endReference - new Date(fields.pausedAt).getTime()
      : 0

  const elapsed = endReference - started - (fields.pausedTotalMs ?? 0) - pauseTail

  return Math.max(0, fields.durationMinutes * 60_000 - elapsed)
}

export function formatRemainingMs(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function useTournamentTimer(fields: TournamentTimerFields) {
  const [now, setNow] = useState(() => Date.now())

  const isResuming = Boolean(fields.pausedAt && !fields.endedAt && fields.resumeAt)

  useEffect(() => {
    if (fields.status !== "Live" || fields.endedAt) return

    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [fields.status, fields.endedAt, fields.pausedAt, fields.resumeAt, fields.liveStartedAt])

  const remainingMs = useMemo(() => computeRemainingMs(fields, now), [fields, now])
  const isPaused = Boolean(fields.pausedAt && !fields.endedAt)
  const isEnded = fields.status === "Ended" || Boolean(fields.endedAt)

  return {
    remainingMs,
    display: remainingMs == null ? null : formatRemainingMs(remainingMs),
    isPaused,
    isResuming,
    isEnded,
    isActive: fields.status === "Live" && !isEnded,
  }
}
