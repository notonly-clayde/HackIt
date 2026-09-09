export type TournamentStatus = "Open" | "Soon" | "Live" | "Ended"

export type UserProfile = {
  id: string
  email: string
  name: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  emailVerified: boolean
  elo1v1: number
  eloTournament: number
  wins: number
  matchCount: number
  createdAt: string
  updatedAt: string
  lastSyncedAt: string
}

export type UpdateUserProfileInput = {
  displayName?: string
  avatarUrl?: string | null
  bio?: string | null
}

export type TournamentModerator = {
  id: string
  displayName: string
  email: string
}

export type LobbyPlayer = {
  id: string
  displayName: string
  avatarUrl: string | null
  eloTournament: number
  role: "host" | "mod" | "player"
  joinedAt: string
}

export type LobbyState = {
  tournamentId: string
  players: LobbyPlayer[]
  playerCount: number
  maxPlayers: number
}

export type LobbyCountUpdate = {
  tournamentId: string
  playerCount: number
  maxPlayers: number
}

export type TournamentItem = {
  id: string
  name: string
  type: "1v1 Match" | "Free For All"
  date: string
  status: "Open" | "Soon" | "Live" | "Ended"
  players: number
  maxPlayers: number
  duration: string
  durationMinutes: number
  description: string
  visibility: "public" | "private"
  startMode: "manual" | "auto"
  host: string
  hostId: string
  passwordProtected?: boolean
  moderators: TournamentModerator[]
  scheduledAt: string
}

export type CreateTournamentInput = {
  name: string
  description?: string
  type?: "ffa" | "1v1"
  schedule: "now" | "later"
  startsAt?: string
  visibility: "public" | "private"
  password?: string
  startMode: "manual" | "auto"
  maxPlayers: number
  durationMinutes?: number
  moderatorEmails?: string[]
}

export type UpdateTournamentInput = {
  name?: string
  description?: string
  type?: "ffa" | "1v1"
  schedule?: "now" | "later"
  startsAt?: string
  visibility?: "public" | "private"
  password?: string | null
  startMode?: "manual" | "auto"
  maxPlayers?: number
  durationMinutes?: number
  moderatorEmails?: string[]
}
