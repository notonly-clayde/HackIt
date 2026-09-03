import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Modal from "../components/ui/Modal"
import Field from "../components/ui/Field"
import Badge from "../components/ui/Badge"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import TournamentProblemSet from "../components/problems/TournamentProblemSet"
import ReportButton from "../components/moderation/ReportButton"
import TournamentService from "../services/TournamentService"
import {
  applyLiveStateToTournament,
  disconnectLobbySocket,
  joinLobby,
  leaveLobby,
  subscribeLobbyState,
  subscribeTournamentLiveState,
  watchLobby,
} from "../services/socket"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useTournamentDetail } from "../hooks/queries/useTournamentQueries"
import { useTournamentRemovedRedirect } from "../hooks/useTournamentRemovedRedirect"
import { queryKeys } from "../lib/queryKeys"
import type { LobbyPlayer, LobbyState } from "../types/api"

const roleBadge = (role: LobbyPlayer["role"]) => {
  if (role === "mod") return <Badge tone="warn">Mod</Badge>
  return null
}

type LobbyLocationState = {
  lobbyPassword?: string
}

const isPasswordError = (message: string) => message.toLowerCase().includes("password")

const lobbyJoinInitiated = new Set<string>()
const inFlightLobbyJoins = new Set<string>()
const pendingLobbyPasswords = new Map<string, string>()

function readNavigationPassword(state: unknown): string | null {
  const password = (state as LobbyLocationState | null)?.lobbyPassword?.trim()
  return password || null
}

function rememberNavigationPassword(tournamentId: string, state: unknown) {
  const password = readNavigationPassword(state)
  if (password) {
    pendingLobbyPasswords.set(tournamentId, password)
  }
}

const TournamentLobbyPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { data: tournament, isLoading, isFetching, error: queryError } = useTournamentDetail(id, token)

  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [lobbyPassword, setLobbyPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const joinedRef = useRef(false)
  const joiningRef = useRef(false)
  const isHostRef = useRef(false)
  const enteringLiveRef = useRef(false)

  useTournamentRemovedRedirect(id, token, queryError, {
    onRemoved: () => {
      enteringLiveRef.current = true
      joinedRef.current = false
      if (id) {
        lobbyJoinInitiated.delete(id)
        pendingLobbyPasswords.delete(id)
        inFlightLobbyJoins.delete(id)
      }
      if (token) {
        void leaveLobby(token)
      }
      disconnectLobbySocket()
    },
  })

  useEffect(() => {
    if (!id) return
    rememberNavigationPassword(id, location.state)
    if (readNavigationPassword(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [id, location.pathname, location.state, navigate])

  useEffect(() => {
    if (!id) return
    return () => {
      lobbyJoinInitiated.delete(id)
      pendingLobbyPasswords.delete(id)
    }
  }, [id])

  const isHost = Boolean(profile && tournament && tournament.hostId === profile.id)

  useEffect(() => {
    isHostRef.current = isHost
  }, [isHost])

  const goToLiveDestination = useCallback(() => {
    if (!id) return
    enteringLiveRef.current = true

    if (isHostRef.current) {
      navigate(`/tournament/${id}/spectate`)
      return
    }

    navigate(`/tournament/${id}/play`)
  }, [id, navigate])

  const patchPlayerCount = useCallback(
    (playerCount: number, maxPlayers?: number) => {
      if (!id) return
      queryClient.setQueryData(queryKeys.tournaments.detail(id), (prev: typeof tournament) =>
        prev
          ? {
              ...prev,
              players: playerCount,
              maxPlayers: maxPlayers ?? prev.maxPlayers,
            }
          : prev,
      )
    },
    [id, queryClient],
  )

  const attemptJoin = useCallback(
    async (password?: string) => {
      if (!id || !token) return

      inFlightLobbyJoins.add(id)
      joiningRef.current = true
      setJoining(true)
      setError(null)
      setPasswordError(null)
      setPasswordOpen(false)

      try {
        const ack = await joinLobby(token, id, password)

        if (!ack.ok) {
          if (isPasswordError(ack.error)) {
            setPasswordError(ack.error)
            toast.error(ack.error)
            setPasswordOpen(true)
            return
          }

          setError(ack.error)
          toast.error(ack.error)
          return
        }

        setLobbyState(ack.state)
        setPasswordOpen(false)
        setPasswordError(null)
        joinedRef.current = true
        pendingLobbyPasswords.delete(id)
        patchPlayerCount(ack.state.playerCount, ack.state.maxPlayers)
      } catch (joinErr) {
        const message = joinErr instanceof Error ? joinErr.message : "Failed to join lobby"
        setError(message)
        toast.error(message)
      } finally {
        inFlightLobbyJoins.delete(id)
        joiningRef.current = false
        setJoining(false)
      }
    },
    [id, token, patchPlayerCount, toast],
  )

  const attemptWatch = useCallback(async () => {
    if (!id || !token) return

    setJoining(true)
    setError(null)

    try {
      const ack = await watchLobby(token, id)

      if (!ack.ok) {
        setError(ack.error)
        toast.error(ack.error)
        return
      }

      setLobbyState(ack.state)
      patchPlayerCount(ack.state.playerCount, ack.state.maxPlayers)
    } catch (watchErr) {
      const message = watchErr instanceof Error ? watchErr.message : "Failed to open lobby"
      setError(message)
      toast.error(message)
    } finally {
      setJoining(false)
    }
  }, [id, token, patchPlayerCount, toast])

  useEffect(() => {
    if (!token) return

    const unsubscribe = subscribeLobbyState(
      token,
      (state) => {
        if (state.tournamentId === id) {
          setLobbyState(state)
          patchPlayerCount(state.playerCount, state.maxPlayers)
        }
      },
      (message) => {
        if (joinedRef.current || joiningRef.current) return

        if (isPasswordError(message)) {
          setPasswordError(message)
          setPasswordOpen(true)
          toast.error(message)
          return
        }

        setError(message)
        toast.error(message)
      },
    )

    return unsubscribe
  }, [token, id, patchPlayerCount, toast])

  useEffect(() => {
    if (!tournament || !id) return
    if (lobbyJoinInitiated.has(id) || inFlightLobbyJoins.has(id)) return

    if (tournament.status === "Live") {
      enteringLiveRef.current = true
      if (tournament.viewerRole === "host" || tournament.hostId === profile?.id) {
        navigate(`/tournament/${id}/spectate`, { replace: true })
      } else if (tournament.viewerRole === "player" || tournament.viewerRole === "mod") {
        navigate(`/tournament/${id}/play`, { replace: true })
      } else {
        navigate(`/tournament/${id}/spectate`, { replace: true })
      }
      return
    }

    if (tournament.status === "Ended") {
      navigate(`/tournament/${id}/spectate`, { replace: true })
      return
    }

    if (!token) {
      const message = "Not authenticated"
      setError(message)
      toast.error(message)
      return
    }

    lobbyJoinInitiated.add(id)
    const hostUser = tournament.hostId === profile?.id

    if (hostUser) {
      void attemptWatch()
      return
    }

    if (tournament.passwordProtected) {
      const pendingPassword = pendingLobbyPasswords.get(id)
      if (pendingPassword) {
        pendingLobbyPasswords.delete(id)
        setLobbyPassword(pendingPassword)
        void attemptJoin(pendingPassword)
        return
      }

      setPasswordError(null)
      setPasswordOpen(true)
      return
    }

    void attemptJoin()
  }, [tournament, id, token, profile?.id, attemptJoin, attemptWatch, navigate, toast])

  useEffect(() => {
    if (!token || !id) return

    const unsubscribe = subscribeTournamentLiveState(token, (state) => {
      if (state.tournamentId !== id) return

      queryClient.setQueryData(queryKeys.tournaments.detail(id), (prev: typeof tournament) =>
        prev ? applyLiveStateToTournament(prev, state) : prev,
      )

      if (state.status === "Live") {
        goToLiveDestination()
      }

      if (state.status === "Ended") {
        enteringLiveRef.current = true
        navigate(`/tournament/${id}/spectate`, { replace: true })
      }
    })

    return unsubscribe
  }, [token, id, goToLiveDestination, navigate, queryClient])

  useEffect(() => {
    return () => {
      if (joinedRef.current && token && !enteringLiveRef.current) {
        void leaveLobby(token)
      }

      if (!enteringLiveRef.current) {
        disconnectLobbySocket()
      }
    }
  }, [token])

  const handleVerifyPassword = async () => {
    setPasswordError(null)
    await attemptJoin(lobbyPassword)
  }

  const handleLeave = async () => {
    if (!token || !id) return

    setLeaving(true)
    await leaveLobby(token)
    joinedRef.current = false
    if (id) {
      lobbyJoinInitiated.delete(id)
      pendingLobbyPasswords.delete(id)
    }
    disconnectLobbySocket()
    setLeaving(false)
    navigate(`/tournament/${id}`)
  }

  const handleStart = async () => {
    if (!id || !token || !tournament) return

    setStarting(true)
    setError(null)

    const [updated, err] = await TournamentService.start(token, id)
    setStarting(false)

    if (err) {
      toast.error(err)
      return
    }

    if (updated) {
      queryClient.setQueryData(queryKeys.tournaments.detail(id), updated)
    }

    goToLiveDestination()
  }

  if (isLoading && !tournament) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading lobby…" />
      </div>
    )
  }

  if ((queryError && !tournament) || (error && !lobbyState && !isHost)) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Could not join lobby"
          description={error ?? queryError?.message}
          action={
            <Link to={id ? `/tournament/${id}` : "/tournament"}>
              <Button variant="secondary">Back</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Lobby not found"
          description={error ?? undefined}
          action={
            <Link to="/tournament">
              <Button variant="secondary">Back</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const playerCount = lobbyState?.playerCount ?? tournament.players
  const maxPlayers = lobbyState?.maxPlayers ?? tournament.maxPlayers
  const players = lobbyState?.players ?? []

  return (
    <div className="page-container mt-8 sm:mt-10 max-w-3xl">
      <Link to={`/tournament/${tournament.id}`} className="text-sm text-muted hover:text-highlight">
        ← Event details
      </Link>

      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-4 text-center sm:text-left border-l-0 sm:border-l-2 sm:border-highlight/50 sm:pl-4">
        <p className="ui-kicker mb-2 justify-center sm:justify-start">
          {isHost ? "Host staging" : "Staging lobby"}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">{tournament.name}</h1>
        <p className="text-muted text-sm mt-2">
          {isHost
            ? "Manage the lobby and start the tournament when ready. You will not join as a player."
            : "Waiting for the tournament to start. "}
          {!isHost &&
            (tournament.startMode === "auto"
              ? `Auto-starts at ${tournament.maxPlayers} players.`
              : "Host will start manually.")}
        </p>
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div>
            <p className="text-accent font-semibold tabular-nums tracking-tight">
              {playerCount} / {maxPlayers} players
            </p>
            <p className="text-muted text-sm mt-0.5">
              {joining ? "Connecting…" : "Live lobby — updates in realtime"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isHost && (
              <Button
                variant="primary"
                onClick={handleStart}
                disabled={starting || tournament.status !== "Open"}
              >
                {starting ? "Starting…" : "Start tournament"}
              </Button>
            )}

            {(tournament.status === "Live" || tournament.status === "Ended") && (
              <Link to={`/tournament/${tournament.id}/spectate`}>
                <Button variant="secondary">Spectate</Button>
              </Link>
            )}

            {!isHost && (
              <Button variant="ghost" onClick={handleLeave} disabled={leaving}>
                {leaving ? "Leaving…" : "Leave lobby"}
              </Button>
            )}
          </div>
        </div>

        {players.length === 0 ? (
          <EmptyState
            title="No players in lobby yet"
            description={
              isHost
                ? "Share the event link so players can join before you start."
                : "Be the first to join, or wait for others to arrive."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {players.map((player) => (
              <li key={player.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-highlight/15 text-highlight flex items-center justify-center text-sm font-semibold shrink-0">
                    {player.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/u/${player.id}`}
                        className="text-accent font-medium truncate hover:text-highlight hover:underline"
                      >
                        {player.displayName}
                      </Link>
                      {roleBadge(player.role)}
                      {profile?.id === player.id && <Badge tone="neutral">You</Badge>}
                    </div>
                    <p className="text-muted text-xs tabular-nums">ELO {player.eloTournament}</p>
                  </div>
                </div>
                <ReportButton
                  targetType="user"
                  targetId={player.id}
                  contextTournamentId={tournament.id}
                  label=""
                  variant="ghost"
                  className="!px-2 shrink-0"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TournamentProblemSet
        tournamentId={tournament.id}
        token={token}
        isHost={isHost}
        mode={tournament.status === "Open" || tournament.status === "Soon" ? "full" : "readonly"}
      />

      <Modal
        open={passwordOpen}
        onClose={() => {
          if (id) lobbyJoinInitiated.delete(id)
          setPasswordOpen(false)
          setPasswordError(null)
          navigate(`/tournament/${tournament.id}`)
        }}
        title="Lobby password"
        description="This private tournament requires a password to enter the lobby."
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                if (id) lobbyJoinInitiated.delete(id)
                setPasswordOpen(false)
                setPasswordError(null)
                navigate(`/tournament/${tournament.id}`)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleVerifyPassword} disabled={joining || !lobbyPassword}>
              {joining ? "Joining…" : "Enter lobby"}
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

export default TournamentLobbyPage
