import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Badge from "../components/ui/Badge"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import TournamentTimer from "../components/tournament/TournamentTimer"
import HostLeaderboard from "../components/tournament/HostLeaderboard"
import HostCodeViewer from "../components/tournament/HostCodeViewer"
import DisciplinePanel from "../components/tournament/DisciplinePanel"
import PlayerDisciplineActions from "../components/tournament/PlayerDisciplineActions"
import TournamentProblemSet from "../components/problems/TournamentProblemSet"
import TournamentProblemList from "../components/problems/TournamentProblemList"
import TournamentService from "../services/TournamentService"
import {
  subscribeTournamentDisciplineUpdate,
  subscribeTournamentIntegrityAlert,
  subscribeTournamentWorkspaceUpdate,
  watchTournament,
  watchTournamentHost,
} from "../services/socket"
import { useAuth } from "../contexts/AuthContext"
import { useHudSound } from "../contexts/SoundContext"
import { useToast } from "../contexts/ToastContext"
import { useConfirm } from "../contexts/ConfirmContext"
import { useContestFreezeSounds } from "../hooks/useContestFreezeSounds"
import { useResumeCountdown } from "../hooks/useResumeCountdown"
import { useStandingsUpdateSound } from "../hooks/useStandingsUpdateSound"
import { useTournamentStatusSound } from "../hooks/useTournamentStatusSound"
import { useTournamentUrgencySound } from "../hooks/useTournamentUrgencySound"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import {
  useTournamentDetail,
  useTournamentDiscipline,
  useTournamentProblems,
  useTournamentStandings,
} from "../hooks/queries/useTournamentQueries"
import {
  problemsFromItems,
  useTournamentLiveStateSocket,
  useTournamentProblemSetSocket,
  useTournamentStandingsLiveSocket,
} from "../hooks/useTournamentLiveSockets"
import { queryKeys } from "../lib/queryKeys"
import type { PlayerWorkspaceView, TournamentFocusViolationEvent } from "../types/api"

const TournamentSpectate = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, profile } = useAuth()
  const { play } = useHudSound()
  const toast = useToast()
  const { confirm } = useConfirm()
  const redirectedRef = useRef(false)

  const { data: tournament, isLoading, isFetching, error: queryError } = useTournamentDetail(id, token)
  useQueryErrorToast(queryError)
  const showLiveData = tournament?.status === "Live" || tournament?.status === "Ended"
  const { data: standings = null } = useTournamentStandings(id, token, showLiveData)
  const { data: problemItems = [] } = useTournamentProblems(id, token, showLiveData)

  const problems = problemsFromItems(problemItems)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [playerWorkspace, setPlayerWorkspace] = useState<PlayerWorkspaceView | null>(null)
  const [viewedProblemId, setViewedProblemId] = useState<string | null>(null)
  const [acting, setActing] = useState<"pause" | "resume" | "end" | null>(null)
  const [focusAlerts, setFocusAlerts] = useState<TournamentFocusViolationEvent[]>([])
  const followActiveProblemRef = useRef(true)

  const isHost = Boolean(
    tournament && (tournament.viewerRole === "host" || (profile && tournament.hostId === profile.id)),
  )
  const isMod = tournament?.viewerRole === "mod"
  const canWatchAsStaff = isHost || isMod
  const { data: discipline } = useTournamentDiscipline(id, token, canWatchAsStaff && showLiveData)

  const { contestFrozen, isResuming, secondsLeft } = useResumeCountdown({
    pausedAt: tournament?.pausedAt,
    resumeAt: tournament?.resumeAt,
    endedAt: tournament?.endedAt,
  })

  const isEnded = tournament?.status === "Ended"
  const isLive = tournament?.status === "Live"

  const timerFields = {
    status: tournament?.status ?? "Open",
    durationMinutes: tournament?.durationMinutes ?? 0,
    liveStartedAt: tournament?.liveStartedAt,
    pausedAt: tournament?.pausedAt,
    resumeAt: tournament?.resumeAt,
    pausedTotalMs: tournament?.pausedTotalMs,
    endedAt: tournament?.endedAt,
  }

  useContestFreezeSounds(contestFrozen, isResuming ? secondsLeft : null, isLive)
  useTournamentUrgencySound(timerFields, isLive)
  useStandingsUpdateSound(standings, isLive)
  useTournamentStatusSound(tournament?.status, isLive || isEnded)

  useEffect(() => {
    if (!tournament || !id || redirectedRef.current) return
    if (tournament.status === "Open" || tournament.status === "Soon") {
      redirectedRef.current = true
      navigate(`/tournament/${id}/lobby`, { replace: true })
    }
  }, [tournament, id, navigate])

  const loadPlayerWorkspace = useCallback(
    async (userId: string, problemId?: string) => {
      if (!id || !token) return

      const [workspace] = await TournamentService.getPlayerWorkspace(token, id, userId, problemId)
      if (!workspace) return

      setPlayerWorkspace(workspace)
      setViewedProblemId(workspace.problemId || workspace.session.activeProblemId)
    },
    [id, token],
  )

  useEffect(() => {
    if (!token || !id) return

    const unwatch = canWatchAsStaff
      ? watchTournamentHost(token, id)
      : watchTournament(token, id)

    const unsubscribeWorkspace = subscribeTournamentWorkspaceUpdate(token, (update) => {
      if (update.tournamentId !== id || update.userId !== selectedUserId) return

      const targetProblemId = followActiveProblemRef.current
        ? update.activeProblemId ?? update.problemId
        : viewedProblemId

      if (followActiveProblemRef.current && targetProblemId) {
        setViewedProblemId(targetProblemId)
      }

      setPlayerWorkspace((prev) => {
        if (!prev) return prev

        const resolvedProblemId = targetProblemId ?? prev.problemId

        return {
          ...prev,
          session: {
            activeProblemId: update.activeProblemId,
            language: update.language,
            updatedAt: update.updatedAt,
          },
          problemId: resolvedProblemId,
          sourceCode: update.problemId === resolvedProblemId ? update.sourceCode : prev.sourceCode,
          updatedAt: update.updatedAt,
        }
      })
    })

    return () => {
      unwatch()
      unsubscribeWorkspace()
    }
  }, [canWatchAsStaff, id, selectedUserId, token, viewedProblemId])

  useEffect(() => {
    if (!token || !id || !canWatchAsStaff) return

    return subscribeTournamentIntegrityAlert(token, (event) => {
      if (event.tournamentId !== id) return
      toast.error(`${event.displayName} left the arena tab (−${event.deduction} pts)`)
      setFocusAlerts((prev) => [event, ...prev].slice(0, 5))
    })
  }, [token, id, canWatchAsStaff, toast])

  useEffect(() => {
    if (!token || !id || !canWatchAsStaff) return

    return subscribeTournamentDisciplineUpdate(token, (event) => {
      if (event.tournamentId !== id) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.discipline(id) })
    })
  }, [token, id, canWatchAsStaff, queryClient])

  useTournamentLiveStateSocket(token, id)
  useTournamentStandingsLiveSocket(token, id)
  useTournamentProblemSetSocket(token, id)

  const handleSelectPlayer = (userId: string) => {
    if (userId !== selectedUserId) play("toggle")
    setSelectedUserId(userId)
    followActiveProblemRef.current = true
    void loadPlayerWorkspace(userId)
  }

  const handleProblemChange = (problemId: string) => {
    if (!selectedUserId) return
    followActiveProblemRef.current = false
    setViewedProblemId(problemId)
    void loadPlayerWorkspace(selectedUserId, problemId)
  }

  const refreshTournament = () => {
    if (!id) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) })
  }

  const handlePauseToggle = async () => {
    if (!id || !token || !tournament || !isHost) return

    const paused = Boolean(tournament.pausedAt && !tournament.endedAt)
    setActing(paused ? "resume" : "pause")

    const [, err] = paused
      ? await TournamentService.resume(token, id)
      : await TournamentService.pause(token, id)

    setActing(null)

    if (err) {
      toast.error(err)
      return
    }

    refreshTournament()
  }

  const handleEnd = async () => {
    if (!id || !token || !tournament || !isHost) return

    const ok = await confirm({
      title: "End tournament",
      message: "End this tournament for all players?",
      confirmLabel: "End tournament",
      variant: "danger",
    })
    if (!ok) return

    setActing("end")
    const [, err] = await TournamentService.end(token, id)
    setActing(null)

    if (err) {
      toast.error(err)
      return
    }

    refreshTournament()
  }

  if (isLoading && !tournament) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading live view…" />
      </div>
    )
  }

  if ((queryError && !tournament) || !tournament) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Tournament not found"
          description={queryError?.message}
          action={
            <Link to={id ? `/tournament/${id}` : "/tournament"}>
              <Button variant="secondary">Back</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isPaused = contestFrozen
  const resumeScheduled = isResuming && secondsLeft != null
  const resumeCountdownActive = resumeScheduled && secondsLeft > 0
  const canEnterPlay = isLive && tournament.viewerRole === "player" && !tournament.viewerDisqualified

  const kicker = isEnded
    ? "Recording"
    : isHost
      ? "Host control"
      : isMod
        ? "Mod dashboard"
        : "Live feed"

  const subtitle = isEnded
    ? "Final standings from recorded submissions."
    : isHost
      ? "Manage the live tournament and monitor player code."
      : isMod
        ? "Monitor player code and integrity alerts. Warn players or request a suspension from the host."
        : "Live leaderboard updates when players submit."

  const selectedEntry = standings?.entries.find((entry) => entry.userId === selectedUserId) ?? null

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to={`/tournament/${id}`} className="text-sm text-muted hover:text-highlight">
        ← Event details
      </Link>

      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-4 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="border-l-2 border-highlight/50 pl-4">
          <p className="ui-kicker mb-1">{kicker}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">
            {tournament.name}
            {isEnded ? " · Results" : isLive ? " · Live" : ""}
          </h1>
          <p className="text-muted text-sm mt-2">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {isLive && <Badge tone="live">Live</Badge>}
            {isEnded && <Badge tone="neutral">Ended</Badge>}
            {isLive && isPaused && !resumeScheduled && <Badge tone="warn">Paused</Badge>}
            {isLive && resumeCountdownActive && (
              <Badge tone="warn">Resuming in {secondsLeft}</Badge>
            )}
            {isLive && resumeScheduled && !resumeCountdownActive && (
              <Badge tone="warn">Resuming…</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3">
          {(isLive || isEnded) && <TournamentTimer fields={timerFields} size="lg" />}
          {canEnterPlay && (
            <Link to={`/tournament/${id}/play`}>
              <Button variant="secondary">Enter play</Button>
            </Link>
          )}
        </div>
      </div>

      {isHost && isLive && (
        <Card className="mt-8 p-5 sm:p-6">
          <p className="ui-kicker mb-3">Controls</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isPaused ? "primary" : "secondary"}
              onClick={() => void handlePauseToggle()}
              disabled={acting !== null || resumeScheduled}
            >
              {acting === "pause"
                ? "Pausing…"
                : acting === "resume"
                  ? "Resuming…"
                  : resumeScheduled
                    ? "Resuming…"
                    : isPaused
                      ? "Resume"
                      : "Pause"}
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleEnd()}
              disabled={acting !== null}
            >
              {acting === "end" ? "Stopping…" : "Stop tournament"}
            </Button>
          </div>
        </Card>
      )}

      {canWatchAsStaff && isLive && focusAlerts.length > 0 && (
        <Card className="mt-5 p-5 sm:p-6">
          <p className="ui-kicker mb-3">Focus alerts</p>
          <ul className="space-y-1.5 text-sm">
            {focusAlerts.map((alert) => (
              <li key={`${alert.userId}-${alert.at}`} className="flex flex-wrap items-center gap-2">
                <span className="text-muted text-xs tabular-nums">
                  {new Date(alert.at).toLocaleTimeString()}
                </span>
                <span className="text-accent font-medium">{alert.displayName}</span>
                <span className="text-muted">left the arena tab</span>
                <span className="text-danger tabular-nums">
                  −{alert.deduction} pts (total −{alert.totalDeduction})
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {canWatchAsStaff && id && (isLive || isEnded) && (
        <DisciplinePanel
          tournamentId={id}
          token={token}
          isHost={isHost}
          canDecide={isLive}
          discipline={discipline}
        />
      )}

      {(isLive || isEnded) &&
        (contestFrozen && id && isHost ? (
          <TournamentProblemSet
            tournamentId={id}
            token={token}
            isHost={isHost}
            mode="add-only"
          />
        ) : (
          <TournamentProblemList
            items={problemItems}
            description={
              isEnded
                ? "Problems that were part of this contest."
                : "Problems currently in this live contest."
            }
            previewContext={
              id
                ? { tournamentId: id, from: "spectate", viewerId: profile?.id }
                : undefined
            }
          />
        ))}

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(280px,360px)_1fr] gap-5">
        <Card className="p-5 sm:p-6">
          <p className="ui-kicker mb-3">{isEnded ? "Final rankings" : "Live rankings"}</p>
          <HostLeaderboard
            standings={standings}
            selectedUserId={selectedUserId}
            onSelect={handleSelectPlayer}
          />
        </Card>

        <Card className="p-5 sm:p-6 min-h-[480px]">
          {canWatchAsStaff && isLive && id && selectedEntry && (
            <div className="mb-4 pb-4 border-b border-border">
              <PlayerDisciplineActions
                tournamentId={id}
                token={token}
                staffRole={isHost ? "host" : "mod"}
                player={{
                  userId: selectedEntry.userId,
                  displayName: selectedEntry.displayName,
                  disqualified: selectedEntry.disqualified,
                }}
              />
            </div>
          )}
          {selectedUserId && playerWorkspace ? (
            <HostCodeViewer
              displayName={playerWorkspace.displayName}
              userId={playerWorkspace.userId}
              problems={problems}
              problemId={viewedProblemId}
              onProblemChange={handleProblemChange}
              sourceCode={playerWorkspace.sourceCode}
              language={playerWorkspace.session.language}
            />
          ) : (
            <div className="h-full min-h-[420px] flex items-center justify-center text-muted text-sm text-center px-6">
              {isEnded
                ? "Select a player from the rankings to view their final code."
                : "Select a player from the rankings to view their live code."}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default TournamentSpectate
