import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Modal from "../components/ui/Modal"
import Field from "../components/ui/Field"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import TournamentService from "../services/TournamentService"
import StandingsTable from "../components/tournament/StandingsTable"
import ReportButton from "../components/moderation/ReportButton"
import { useLobbyIndexCounts } from "../hooks/useLobbyIndexCounts"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { useTournamentStandingsSocket } from "../hooks/useTournamentStandingsSocket"
import { useTournamentLiveRedirect } from "../hooks/useTournamentLiveRedirect"
import {
  useTournamentDetail,
  useTournamentStandings,
} from "../hooks/queries/useTournamentQueries"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useConfirm } from "../contexts/ConfirmContext"
import { queryKeys } from "../lib/queryKeys"
import { useModeratorInviteRespond } from "../hooks/useModeratorInviteRespond"
import { subscribeModeratorInviteResolved } from "../services/socket"
import type { TournamentStatus } from "../types/api"

const statusTone: Record<TournamentStatus, "open" | "soon" | "live" | "ended"> = {
  Open: "open",
  Soon: "soon",
  Live: "live",
  Ended: "ended",
}

const TournamentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [deleting, setDeleting] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [lobbyPassword, setLobbyPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [inviteBusy, setInviteBusy] = useState(false)
  const respondModeratorInvite = useModeratorInviteRespond()

  const {
    data: tournament,
    isLoading,
    isFetching,
    error,
  } = useTournamentDetail(id, token)
  useQueryErrorToast(error)

  const showStandings =
    tournament?.status === "Live" || tournament?.status === "Ended"

  const { data: standings = null } = useTournamentStandings(
    id,
    token,
    showStandings,
  )

  useTournamentStandingsSocket(token, id, showStandings)
  useLobbyIndexCounts(token, id)
  useTournamentLiveRedirect(token, tournament)

  useEffect(() => {
    if (!token || !id || !tournament || tournament.hostId !== profile?.id) return

    return subscribeModeratorInviteResolved(token, (event) => {
      if (event.tournamentId !== id) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) })
    })
  }, [token, id, tournament, profile?.id, queryClient])

  if (isLoading && !tournament) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading tournament…" />
      </div>
    )
  }

  if ((error && !tournament) || !tournament) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Tournament not found"
          description={error?.message ?? "This event does not exist."}
          action={
            <Link to="/tournament">
              <Button variant="secondary">Back to list</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isLive = tournament.status === "Live"
  const isEnded = tournament.status === "Ended"
  const isOpen = tournament.status === "Open"
  const isEditable = tournament.status === "Open" || tournament.status === "Soon"
  const isHost = Boolean(profile && tournament.hostId === profile.id)
  const isMod = tournament.viewerRole === "mod"
  const isDisqualified = Boolean(tournament.viewerDisqualified)
  const isContestFinished = Boolean(tournament.viewerContestFinished)
  const isEnrolledPlayer = tournament.viewerRole === "player" && !isDisqualified
  const isParticipant = isEnrolledPlayer && !isContestFinished
  const isStaff = isHost || isMod
  const invitePending = Boolean(tournament.viewerModeratorInvitePending)

  const goToLobby = (password?: string) => {
    const verifiedPassword = typeof password === "string" && password.trim() ? password.trim() : undefined
    navigate(
      `/tournament/${tournament.id}/lobby`,
      verifiedPassword ? { state: { lobbyPassword: verifiedPassword } } : undefined,
    )
  }

  const handleJoinLobby = () => {
    if (tournament.passwordProtected && !isStaff) {
      setPasswordOpen(true)
      setLobbyPassword("")
      setPasswordError(null)
      return
    }
    goToLobby()
  }

  const handleVerifyPassword = async () => {
    setVerifying(true)
    setPasswordError(null)

    const [, err] = await TournamentService.verifyPassword(token, tournament.id, lobbyPassword)
    setVerifying(false)

    if (err) {
      setPasswordError(err)
      toast.error(err)
      return
    }

    setPasswordOpen(false)
    setPasswordError(null)
    goToLobby(lobbyPassword)
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete tournament",
      message: `Delete "${tournament.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    })
    if (!ok) return

    setDeleting(true)
    const [, err] = await TournamentService.remove(token, tournament.id)
    setDeleting(false)

    if (err) {
      toast.error(err)
      return
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.lists() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.hostedAll() })
    navigate("/tournament")
  }

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to="/tournament" className="text-sm text-muted hover:text-highlight transition-colors">
        ← Tournaments
      </Link>

      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-4 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge tone={statusTone[tournament.status]}>{tournament.status}</Badge>
            <Badge tone="neutral">{tournament.visibility === "private" ? "Private" : "Public"}</Badge>
            {tournament.passwordProtected && <Badge tone="warn">Password</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">{tournament.name}</h1>
          <p className="text-muted mt-2 max-w-2xl leading-relaxed">{tournament.description}</p>
          <p className="text-sm text-midtone mt-4">
            {tournament.type} · {tournament.date} · {tournament.duration} · Hosted by {tournament.host}
          </p>
          <p className="text-sm text-muted mt-1">
            {tournament.players}/{tournament.maxPlayers} players · Start:{" "}
            {tournament.startMode === "auto" ? "auto at capacity" : "manual by host"}
          </p>
          {tournament.moderators.length > 0 && (
            <p className="text-sm text-muted mt-2">
              Mods: {tournament.moderators.map((m) => m.displayName).join(", ")}
            </p>
          )}
          {isHost && (tournament.moderatorInvites?.length ?? 0) > 0 && (
            <p className="text-sm text-muted mt-2">
              Pending mods:{" "}
              {tournament.moderatorInvites?.map((m) => `${m.displayName} (awaiting approval)`).join(", ")}
            </p>
          )}
          {invitePending && (
            <Card className="mt-4 p-4 border border-amber-500/30 bg-amber-500/5">
              <p className="text-sm text-accent font-medium">You&apos;ve been invited to moderate this event.</p>
              <p className="text-sm text-muted mt-1">
                {isLive || isEnded
                  ? "This event has already started, so you can no longer accept — decline to dismiss this invite."
                  : "Accept to monitor players from the mod dashboard when the tournament starts."}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="primary"
                  disabled={inviteBusy || isLive || isEnded}
                  onClick={() => {
                    if (!id) return
                    setInviteBusy(true)
                    void respondModeratorInvite(id, true).finally(() => setInviteBusy(false))
                  }}
                >
                  {inviteBusy ? "Saving…" : "Accept"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={inviteBusy}
                  onClick={() => {
                    if (!id) return
                    setInviteBusy(true)
                    void respondModeratorInvite(id, false).finally(() => setInviteBusy(false))
                  }}
                >
                  Decline
                </Button>
              </div>
            </Card>
          )}
          {isDisqualified && (
            <p className="text-sm text-danger mt-3">
              You were disqualified from this tournament
              {tournament.viewerDisqualifyReason ? `: ${tournament.viewerDisqualifyReason}` : "."}
            </p>
          )}
          {isContestFinished && isLive && (
            <p className="text-sm text-muted mt-3">
              You accepted your score and left the arena. You can spectate or watch the scoreboard until the contest
              ends.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <ReportButton targetType="tournament" targetId={tournament.id} variant="ghost" />
          {isHost && isEditable && (
            <>
              <Link to={`/tournament/${tournament.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button variant="ghost" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </>
          )}
          {isOpen && (
            isHost ? (
              <Button variant="primary" onClick={() => goToLobby()}>
                Manage lobby
              </Button>
            ) : isMod ? (
              <Button variant="primary" onClick={() => goToLobby()}>
                Open mod view
              </Button>
            ) : (
              <Button variant="primary" onClick={handleJoinLobby}>
                Join lobby
              </Button>
            )
          )}
          {isLive && (
            <>
              {isHost && (
                <Link to={`/tournament/${tournament.id}/spectate`}>
                  <Button variant="primary">Manage event</Button>
                </Link>
              )}
              {isMod && (
                <Link to={`/tournament/${tournament.id}/spectate`}>
                  <Button variant="primary">Mod dashboard</Button>
                </Link>
              )}
              {isParticipant && (
                <Link to={`/tournament/${tournament.id}/play`}>
                  <Button variant="primary">Enter play</Button>
                </Link>
              )}
              {!isStaff && !isEnrolledPlayer && (
                <Link to={`/tournament/${tournament.id}/spectate`}>
                  <Button variant="primary">Spectate</Button>
                </Link>
              )}
              {isEnrolledPlayer && (
                <Link to={`/tournament/${tournament.id}/spectate`}>
                  <Button variant={isContestFinished ? "primary" : "secondary"}>Spectate</Button>
                </Link>
              )}
            </>
          )}
          {isEnded && (
            <Link to={`/tournament/${tournament.id}/spectate`}>
              <Button variant="secondary">View recording</Button>
            </Link>
          )}
          {tournament.status === "Soon" && <Button variant="ghost" disabled>Notify me</Button>}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-1">
          <p className="ui-kicker mb-3">Briefing</p>
          <h2 className="text-accent font-semibold mb-4 tracking-tight">Event details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="text-muted uppercase tracking-wider text-[0.65rem]">Status</dt>
              <dd className="text-accent font-medium">{tournament.status}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="text-muted uppercase tracking-wider text-[0.65rem]">Format</dt>
              <dd className="text-accent font-medium">{tournament.type}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="text-muted uppercase tracking-wider text-[0.65rem]">Duration</dt>
              <dd className="text-accent font-medium">{tournament.duration}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted uppercase tracking-wider text-[0.65rem]">Capacity</dt>
              <dd className="text-accent font-medium tabular-nums">
                {tournament.players}/{tournament.maxPlayers}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="ui-kicker mb-1">Scoreboard</p>
              <h2 className="text-accent font-semibold tracking-tight">
                {isEnded ? "Final standings" : isLive ? "Live leaderboard" : "Preview standings"}
              </h2>
            </div>
            <span className="text-xs text-muted uppercase tracking-wider">
              {isLive ? "Live feed" : "Recorded"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <StandingsTable
              standings={standings}
              compact
              tournamentId={tournament.id}
              emptyMessage={isLive || isEnded ? "No solves yet." : "Standings appear when the contest goes live."}
            />
          </div>
        </Card>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false)
          setPasswordError(null)
        }}
        title="Lobby password"
        description="This private tournament requires a password to enter the lobby."
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setPasswordOpen(false)
                setPasswordError(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleVerifyPassword} disabled={verifying || !lobbyPassword}>
              {verifying ? "Checking…" : "Enter lobby"}
            </Button>
          </div>
        }
      >
        <Field
          label="Password"
          type="password"
          value={lobbyPassword}
          onChange={(e) => {
            setLobbyPassword(e.target.value)
            if (passwordError) setPasswordError(null)
          }}
          error={passwordError ?? undefined}
          autoFocus
        />
      </Modal>
    </div>
  )
}

export default TournamentDetail
