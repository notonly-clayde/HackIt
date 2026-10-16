import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import TournamentService from "../../services/TournamentService"
import {
  subscribeModeratorInviteResolved,
  subscribeModeratorInvites,
  subscribeTournamentLiveState,
  type ModeratorInviteSocketEvent,
} from "../../services/socket"
import type { ModeratorInviteItem, TournamentStatus } from "../../types/api"
import { useModeratorInviteRespond } from "../../hooks/useModeratorInviteRespond"
import ModeratorInviteModal from "./ModeratorInviteModal"

function toInviteItem(event: ModeratorInviteSocketEvent): ModeratorInviteItem {
  return {
    inviteId: event.inviteId,
    tournamentId: event.tournamentId,
    tournamentName: event.tournamentName,
    hostDisplayName: event.hostDisplayName,
    invitedAt: event.invitedAt,
    tournamentStatus: event.tournamentStatus,
  }
}

function inviteKey(invite: ModeratorInviteItem) {
  return `${invite.tournamentId}:${invite.inviteId}`
}

function isAcceptBlocked(status?: TournamentStatus) {
  return status === "Live" || status === "Ended"
}

const ModeratorInviteListener = () => {
  const { token, profile } = useAuth()
  const respond = useModeratorInviteRespond()
  const [queue, setQueue] = useState<ModeratorInviteItem[]>([])
  const [busy, setBusy] = useState(false)
  const seenKeys = useRef(new Set<string>())

  const patchInviteStatus = useCallback((tournamentId: string, tournamentStatus: TournamentStatus) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.tournamentId === tournamentId ? { ...item, tournamentStatus } : item,
      ),
    )
  }, [])

  const removeForTournament = useCallback((tournamentId: string) => {
    setQueue((prev) => {
      for (const item of prev) {
        if (item.tournamentId === tournamentId) {
          seenKeys.current.delete(inviteKey(item))
        }
      }
      return prev.filter((item) => item.tournamentId !== tournamentId)
    })
  }, [])

  const enqueue = useCallback((invite: ModeratorInviteItem) => {
    const key = inviteKey(invite)
    if (seenKeys.current.has(key)) return
    seenKeys.current.add(key)
    setQueue((prev) => {
      if (prev.some((item) => inviteKey(item) === key)) return prev
      return [...prev, invite]
    })
  }, [])

  useEffect(() => {
    if (!token) return

    let cancelled = false
    void TournamentService.listModeratorInvites(token).then(([items]) => {
      if (cancelled || !items) return
      for (const invite of items) enqueue(invite)
    })

    const unsubscribeInvite = subscribeModeratorInvites(token, (event) => {
      enqueue(toInviteItem(event))
    })

    const unsubscribeResolved = subscribeModeratorInviteResolved(token, (event) => {
      if (profile?.id && event.userId !== profile.id) return
      if (event.status === "accepted" || event.status === "declined") {
        removeForTournament(event.tournamentId)
      }
    })

    const unsubscribeLive = subscribeTournamentLiveState(token, (state) => {
      if (state.status === "Live" || state.status === "Ended") {
        patchInviteStatus(state.tournamentId, state.status)
      }
    })

    return () => {
      cancelled = true
      unsubscribeInvite()
      unsubscribeResolved()
      unsubscribeLive()
    }
  }, [token, profile?.id, enqueue, removeForTournament, patchInviteStatus])

  const active = queue[0] ?? null
  const acceptDisabled = isAcceptBlocked(active?.tournamentStatus)

  const dequeue = useCallback(() => {
    setQueue((prev) => {
      const next = prev.slice(1)
      if (prev[0]) seenKeys.current.delete(inviteKey(prev[0]))
      return next
    })
  }, [])

  const handleRespond = async (accept: boolean) => {
    if (!active) return
    setBusy(true)
    const ok = await respond(active.tournamentId, accept)
    setBusy(false)
    if (!ok) return
    dequeue()
  }

  const handleDismiss = () => {
    void handleRespond(false)
  }

  return (
    <ModeratorInviteModal
      open={Boolean(active)}
      invite={active}
      busy={busy}
      acceptDisabled={acceptDisabled}
      onAccept={() => void handleRespond(true)}
      onDecline={handleDismiss}
      onClose={handleDismiss}
    />
  )
}

export default ModeratorInviteListener
