import { useEffect, useMemo, useState } from "react"

type ResumeCountdownInput = {
  pausedAt?: string | null
  resumeAt?: string | null
  endedAt?: string | null
}

export function isContestFrozen(input: ResumeCountdownInput): boolean {
  return Boolean(input.pausedAt && !input.endedAt)
}

export function useResumeCountdown(input: ResumeCountdownInput) {
  const [now, setNow] = useState(() => Date.now())

  const contestFrozen = isContestFrozen(input)

  useEffect(() => {
    if (!contestFrozen) return

    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [contestFrozen, input.resumeAt, input.pausedAt])

  return useMemo(() => {
    if (!contestFrozen) {
      return { contestFrozen: false, isResuming: false, secondsLeft: null as number | null }
    }

    if (!input.resumeAt) {
      return { contestFrozen: true, isResuming: false, secondsLeft: null as number | null }
    }

    const resumeMs = new Date(input.resumeAt).getTime()
    const remainingMs = resumeMs - now

    if (remainingMs <= 0) {
      return { contestFrozen: true, isResuming: true, secondsLeft: 0 }
    }

    return {
      contestFrozen: true,
      isResuming: true,
      secondsLeft: Math.ceil(remainingMs / 1000),
    }
  }, [contestFrozen, input.resumeAt, now])
}
