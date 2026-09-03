import { io, type Socket } from "socket.io-client"
import { getAuthJwt } from "../utils/auth"
import type {
  LobbyCountUpdate,
  LobbyState,
  TournamentCatalogUpdate,
  TournamentLiveState,
  TournamentProblemSetUpdate,
  TournamentStandings,
  TournamentWorkspaceUpdate,
  VersusDifficulty,
  VersusMatch,
  VersusMatchEnded,
} from "../types/api"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export type LobbyJoinAck =
  | { ok: true; state: LobbyState }
  | { ok: false; error: string }

export type LobbyWatchAck =
  | { ok: true; state: LobbyState }
  | { ok: false; error: string }

export type LobbyLeaveAck = { ok: true } | { ok: false; error: string }

export type LobbyStartedEvent = {
  tournamentId: string
  status: "Live"
}

let socket: Socket | null = null
let socketToken: string | null = null
let connectPromise: Promise<Socket> | null = null

function createLobbySocket(token: string): Socket {
  return io(API_URL.replace(/\/$/, ""), {
    auth: { token },
    autoConnect: false,
    transports: ["websocket", "polling"],
  })
}

function attachLobbySocket(token: string): Socket {
  if (socket && socketToken !== token) {
    disconnectLobbySocket()
  }

  if (!socket) {
    socketToken = token
    socket = createLobbySocket(token)
  } else {
    socket.auth = { token }
    socketToken = token
  }

  return socket
}

export function getLobbySocket(_token: string): Socket {
  return socket ?? attachLobbySocket(_token)
}

export function disconnectLobbySocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    socketToken = null
    connectPromise = null
  }
}

async function ensureLobbySocketConnected(_token: string | null): Promise<Socket> {
  const token = await getAuthJwt()
  if (!token) {
    throw new Error("Not authenticated")
  }

  const client = attachLobbySocket(token)

  if (client.connected) {
    return client
  }

  if (!connectPromise) {
    connectPromise = new Promise((resolve, reject) => {
      const onConnect = () => {
        cleanup()
        connectPromise = null
        resolve(client)
      }

      const onError = (error: Error) => {
        cleanup()
        connectPromise = null
        reject(error)
      }

      const cleanup = () => {
        client.off("connect", onConnect)
        client.off("connect_error", onError)
      }

      client.once("connect", onConnect)
      client.once("connect_error", onError)
      client.connect()
    })
  }

  return connectPromise
}

export function watchLobbyIndex(
  token: string,
  onCount: (update: LobbyCountUpdate) => void,
): () => void {
  return watchTournamentIndex(token, { onCount })
}

type TournamentIndexHandlers = {
  onCount?: (update: LobbyCountUpdate) => void
  onCatalog?: (update: TournamentCatalogUpdate) => void
  onLiveState?: (state: TournamentLiveState) => void
}

export function subscribeTournamentCatalog(
  token: string,
  onUpdate: (update: TournamentCatalogUpdate) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (update: TournamentCatalogUpdate) => onUpdate(update)

  client.on("tournament:catalog-update", handle)
  void ensureLobbySocketConnected(token)

  return () => {
    client.off("tournament:catalog-update", handle)
  }
}

export function watchTournamentIndex(
  token: string,
  handlers: TournamentIndexHandlers,
): () => void {
  const client = getLobbySocket(token)

  const handleCount = (update: LobbyCountUpdate) => handlers.onCount?.(update)
  const handleCatalog = (update: TournamentCatalogUpdate) => handlers.onCatalog?.(update)
  const handleLiveState = (state: TournamentLiveState) => handlers.onLiveState?.(state)

  if (handlers.onCount) client.on("lobby:count", handleCount)
  if (handlers.onCatalog) client.on("tournament:catalog-update", handleCatalog)
  if (handlers.onLiveState) client.on("tournament:live-state", handleLiveState)

  void ensureLobbySocketConnected(token).then(() => {
    client.emit("lobby:watch-index")
  })

  return () => {
    if (handlers.onCount) client.off("lobby:count", handleCount)
    if (handlers.onCatalog) client.off("tournament:catalog-update", handleCatalog)
    if (handlers.onLiveState) client.off("tournament:live-state", handleLiveState)
    if (client.connected) {
      client.emit("lobby:unwatch-index")
    }
  }
}

export async function watchLobby(token: string, tournamentId: string): Promise<LobbyWatchAck> {
  const client = await ensureLobbySocketConnected(token)

  return new Promise((resolve) => {
    client.emit("lobby:watch", { tournamentId }, (ack: LobbyWatchAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export async function joinLobby(
  token: string,
  tournamentId: string,
  password?: string,
): Promise<LobbyJoinAck> {
  const client = await ensureLobbySocketConnected(token)

  return new Promise((resolve) => {
    client.emit("lobby:join", { tournamentId, password }, (ack: LobbyJoinAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export async function reconnectLobby(
  token: string,
  tournamentId: string,
): Promise<LobbyJoinAck> {
  const client = await ensureLobbySocketConnected(token)

  return new Promise((resolve) => {
    client.emit("lobby:reconnect", { tournamentId }, (ack: LobbyJoinAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export function leaveLobby(_token: string): Promise<LobbyLeaveAck> {
  const client = socket

  return new Promise((resolve) => {
    if (!client?.connected) {
      resolve({ ok: true })
      return
    }

    client.emit("lobby:leave", {}, (ack: LobbyLeaveAck) => {
      resolve(ack ?? { ok: true })
    })
  })
}

export function watchTournament(token: string, tournamentId: string): () => void {
  const client = getLobbySocket(token)

  void ensureLobbySocketConnected(token).then(() => {
    client.emit("tournament:watch", { tournamentId })
  })

  return () => {
    if (client.connected) {
      client.emit("tournament:unwatch", { tournamentId })
    }
  }
}

export function subscribeLobbyState(
  token: string,
  onState: (state: LobbyState) => void,
  onError: (message: string) => void,
): () => void {
  const client = getLobbySocket(token)

  const handleState = (state: LobbyState) => onState(state)
  const handleError = (payload: { message?: string }) => {
    onError(payload.message ?? "Lobby error")
  }

  client.on("lobby:state", handleState)
  client.on("lobby:error", handleError)

  void ensureLobbySocketConnected(token)

  return () => {
    client.off("lobby:state", handleState)
    client.off("lobby:error", handleError)
  }
}

export function subscribeLobbyStarted(
  token: string,
  onStarted: (event: LobbyStartedEvent) => void,
): () => void {
  const client = getLobbySocket(token)

  const handleStarted = (event: LobbyStartedEvent) => onStarted(event)

  client.on("lobby:started", handleStarted)

  void ensureLobbySocketConnected(token)

  return () => {
    client.off("lobby:started", handleStarted)
  }
}

export function subscribeTournamentLiveState(
  token: string,
  onState: (state: TournamentLiveState) => void,
): () => void {
  const client = getLobbySocket(token)

  const handleLiveState = (state: TournamentLiveState) => onState(state)

  client.on("tournament:live-state", handleLiveState)

  void ensureLobbySocketConnected(token)

  return () => {
    client.off("tournament:live-state", handleLiveState)
  }
}

export function subscribeTournamentStandings(
  token: string,
  onStandings: (standings: TournamentStandings) => void,
): () => void {
  const client = getLobbySocket(token)

  const handleStandings = (standings: TournamentStandings) => onStandings(standings)

  client.on("tournament:standings", handleStandings)

  void ensureLobbySocketConnected(token)

  return () => {
    client.off("tournament:standings", handleStandings)
  }
}

export function subscribeTournamentProblemSetUpdate(
  token: string,
  onUpdate: (update: TournamentProblemSetUpdate) => void,
): () => void {
  const client = getLobbySocket(token)

  const handleUpdate = (update: TournamentProblemSetUpdate) => onUpdate(update)

  client.on("tournament:problem-set-update", handleUpdate)

  void ensureLobbySocketConnected(token)

  return () => {
    client.off("tournament:problem-set-update", handleUpdate)
  }
}

export function watchTournamentHost(token: string, tournamentId: string): () => void {
  const client = getLobbySocket(token)

  void ensureLobbySocketConnected(token).then(() => {
    client.emit("tournament:host-watch", { tournamentId })
  })

  return () => {
    if (client.connected) {
      client.emit("tournament:host-unwatch", { tournamentId })
    }
  }
}

export function subscribeTournamentWorkspaceUpdate(
  token: string,
  onUpdate: (update: TournamentWorkspaceUpdate) => void,
): () => void {
  const client = getLobbySocket(token)

  const handleUpdate = (update: TournamentWorkspaceUpdate) => onUpdate(update)

  client.on("tournament:workspace-update", handleUpdate)

  void ensureLobbySocketConnected(token)

  return () => {
    client.off("tournament:workspace-update", handleUpdate)
  }
}

export function applyLiveStateToTournament<T extends {
  id: string
  status: TournamentLiveState["status"]
  durationMinutes: number
  liveStartedAt?: string | null
  pausedAt?: string | null
  pausedTotalMs?: number
  resumeAt?: string | null
  endedAt?: string | null
}>(tournament: T, state: TournamentLiveState): T {
  if (tournament.id !== state.tournamentId) return tournament

  return {
    ...tournament,
    status: state.status,
    durationMinutes: state.durationMinutes,
    liveStartedAt: state.liveStartedAt,
    pausedAt: state.pausedAt,
    resumeAt: state.resumeAt,
    pausedTotalMs: state.pausedTotalMs,
    endedAt: state.endedAt,
  }
}

export type VersusQueueAck = { ok: true } | { ok: false; error: string }
export type VersusCancelAck = { ok: true } | { ok: false; error: string }
export type VersusWatchAck =
  | { ok: true; match: VersusMatch }
  | { ok: false; error: string }

export type VersusStartedEvent = {
  matchId: string
  status: "live"
  startedAt: string
  playerAId: string
  playerBId: string
}

export async function queueVersus(
  token: string,
  difficulty: VersusDifficulty,
): Promise<VersusQueueAck> {
  const client = await ensureLobbySocketConnected(token)

  return new Promise((resolve) => {
    client.emit("versus:queue", { difficulty }, (ack: VersusQueueAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export async function cancelVersusQueue(token: string): Promise<VersusCancelAck> {
  const client = await ensureLobbySocketConnected(token)

  return new Promise((resolve) => {
    client.emit("versus:cancel", {}, (ack: VersusCancelAck) => {
      resolve(ack ?? { ok: true })
    })
  })
}

export async function watchVersusMatch(token: string, matchId: string): Promise<VersusWatchAck> {
  const client = await ensureLobbySocketConnected(token)

  return new Promise((resolve) => {
    client.emit("versus:watch", { matchId }, (ack: VersusWatchAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export async function leaveVersusResults(token: string, matchId: string): Promise<void> {
  const client = await ensureLobbySocketConnected(token)
  client.emit("versus:results-leave", { matchId })
}

export function subscribeVersusMatchFound(
  token: string,
  onFound: (match: VersusMatch) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (match: VersusMatch) => onFound(match)
  client.on("versus:match-found", handle)
  void ensureLobbySocketConnected(token)
  return () => {
    client.off("versus:match-found", handle)
  }
}

export function subscribeVersusQueued(
  token: string,
  onQueued: (payload: { difficulty: string }) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (payload: { difficulty: string }) => onQueued(payload)
  client.on("versus:queued", handle)
  void ensureLobbySocketConnected(token)
  return () => {
    client.off("versus:queued", handle)
  }
}

export function subscribeVersusError(
  token: string,
  onError: (payload: { error: string }) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (payload: { error: string }) => onError(payload)
  client.on("versus:error", handle)
  void ensureLobbySocketConnected(token)
  return () => {
    client.off("versus:error", handle)
  }
}

export function subscribeVersusState(
  token: string,
  onState: (match: VersusMatch) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (match: VersusMatch) => onState(match)
  client.on("versus:state", handle)
  void ensureLobbySocketConnected(token)
  return () => {
    client.off("versus:state", handle)
  }
}

export function subscribeVersusStarted(
  token: string,
  onStarted: (event: VersusStartedEvent) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (event: VersusStartedEvent) => onStarted(event)
  client.on("versus:started", handle)
  void ensureLobbySocketConnected(token)
  return () => {
    client.off("versus:started", handle)
  }
}

export function subscribeVersusEnded(
  token: string,
  onEnded: (event: VersusMatchEnded) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (event: VersusMatchEnded) => onEnded(event)
  client.on("versus:ended", handle)
  void ensureLobbySocketConnected(token)
  return () => {
    client.off("versus:ended", handle)
  }
}

export type VersusAck = { ok: true; accepted?: boolean } | { ok: false; error: string }

export async function offerVersusRematch(token: string, matchId: string): Promise<VersusAck> {
  const client = await ensureLobbySocketConnected(token)
  return new Promise((resolve) => {
    client.emit("versus:rematch", { matchId }, (ack: VersusAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export async function offerVersusDraw(token: string, matchId: string): Promise<VersusAck> {
  const client = await ensureLobbySocketConnected(token)
  return new Promise((resolve) => {
    client.emit("versus:draw-offer", { matchId }, (ack: VersusAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export async function respondVersusDraw(
  token: string,
  matchId: string,
  accept: boolean,
): Promise<VersusAck> {
  const client = await ensureLobbySocketConnected(token)
  return new Promise((resolve) => {
    client.emit("versus:draw-respond", { matchId, accept }, (ack: VersusAck) => {
      resolve(ack ?? { ok: false, error: "No response from server" })
    })
  })
}

export function subscribeVersusRematchOffered(
  token: string,
  onOffered: (payload: { matchId: string }) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (payload: { matchId: string }) => onOffered(payload)
  client.on("versus:rematch-offered", handle)
  void ensureLobbySocketConnected(token)
  return () => client.off("versus:rematch-offered", handle)
}

export function subscribeVersusRematchUnavailable(
  token: string,
  onUnavailable: (payload: { matchId: string }) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (payload: { matchId: string }) => onUnavailable(payload)
  client.on("versus:rematch-unavailable", handle)
  void ensureLobbySocketConnected(token)
  return () => client.off("versus:rematch-unavailable", handle)
}

export function subscribeVersusDrawOffered(
  token: string,
  onOffered: (payload: { matchId: string; fromUserId: string }) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (payload: { matchId: string; fromUserId: string }) => onOffered(payload)
  client.on("versus:draw-offered", handle)
  void ensureLobbySocketConnected(token)
  return () => client.off("versus:draw-offered", handle)
}

export function subscribeVersusDrawDeclined(
  token: string,
  onDeclined: (payload: { matchId: string }) => void,
): () => void {
  const client = getLobbySocket(token)
  const handle = (payload: { matchId: string }) => onDeclined(payload)
  client.on("versus:draw-declined", handle)
  void ensureLobbySocketConnected(token)
  return () => client.off("versus:draw-declined", handle)
}

