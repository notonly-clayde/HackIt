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
  createdAt: string
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

export type VersusDifficulty = "easy" | "medium" | "hard"

export type VersusPlayerCard = {
  id: string
  displayName: string
  avatarUrl: string | null
  elo1v1: number
  peakElo1v1: number
  winRate: number
  matchCount: number
  winStreak1v1: number
  wins: number
  losses: number
  draws: number
}

export type VersusEndedReason = "first_ac" | "timeout" | "forfeit" | "agreed_draw" | "abort"

export type VersusMatch = {
  id: string
  kind: "ranked" | "private"
  lobbyName: string | null
  passwordProtected: boolean
  status: "lobby" | "live" | "ended" | "aborted"
  difficulty: VersusDifficulty
  durationMinutes: number
  lobbyEndsAt: string
  startedAt: string | null
  endedAt: string | null
  winnerId: string | null
  endedReason: VersusEndedReason | null
  youAre: "a" | "b"
  playerA: VersusPlayerCard
  /** Null while a private room is waiting for its guest. */
  playerB: VersusPlayerCard | null
  playerAEloBefore: number
  playerBEloBefore: number | null
  playerAEloAfter: number | null
  playerBEloAfter: number | null
  problem: ProblemDetail | null
  solveElapsedMinutes: number | null
}

export type VersusMatchEnded = {
  match: VersusMatch
  result: "win" | "loss" | "draw" | "abort"
  yourEloDelta: number
  endedReason: VersusEndedReason
  solveElapsedMinutes: number | null
}

export type VersusSubmissionResult = SubmissionResult & {
  matchEnded?: VersusMatchEnded
}

export type VersusReviewSubmission = {
  userId: string
  displayName: string
  language: string
  sourceCode: string
  verdict: string
  effectiveElapsedMinutes: number
  submittedAt: string
}

export type VersusReview = {
  matchId: string
  problem: ProblemDetail
  you: VersusReviewSubmission | null
  opponent: VersusReviewSubmission | null
}

export type CreateVersusRoomInput = {
  difficulty: VersusDifficulty
  lobbyName?: string
  password?: string
}

export type MatchHistoryItem = {
  matchId: string
  endedAt: string
  difficulty: VersusDifficulty
  endedReason: VersusEndedReason | null
  result: "win" | "loss" | "draw"
  eloBefore: number
  eloAfter: number
  eloDelta: number
  opponent: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
}

export type ProfileHistoryKind = "all" | "versus" | "tournament"

export type ProfileHistoryVersusItem = MatchHistoryItem & { kind: "versus" }

export type ProfileHistoryTournamentItem = {
  kind: "tournament"
  tournamentId: string
  name: string
  tournamentType: "ffa" | "1v1"
  endedAt: string
  rank: number
  rankTotal: number
  solved: number
  score: number
}

export type ProfileHistoryItem = ProfileHistoryVersusItem | ProfileHistoryTournamentItem
