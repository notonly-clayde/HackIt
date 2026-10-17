export type TournamentStatus = "Open" | "Soon" | "Live" | "Ended"

export type UserRole = "user" | "admin"
export type UserStatus = "active" | "suspended"

export type UserProfile = {
  id: string
  email: string
  name: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  emailVerified: boolean
  role: UserRole
  status: UserStatus
  suspendedAt: string | null
  suspendReason: string | null
  elo1v1: number
  eloTournament: number
  peakElo1v1: number
  winStreak1v1: number
  wins: number
  draws: number
  matchCount: number
  createdAt: string
  updatedAt: string
  lastSyncedAt: string
  activeWarn?: {
    id: string
    note: string | null
    createdAt: string
  } | null
}

export type PublicUserProfile = {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  elo1v1: number
  eloTournament: number
  peakElo1v1: number
  winStreak1v1: number
  wins: number
  draws: number
  matchCount: number
  createdAt: string
}

export type UpdateUserProfileInput = {
  displayName?: string
  avatarUrl?: string | null
  bio?: string | null
}

export type ProblemDifficulty = "easy" | "medium" | "hard"

export type TestCaseInput = {
  input: string
  expectedOutput: string
  isSample: boolean
  order?: number
}

export type CreateProblemInput = {
  title: string
  statement: string
  difficulty?: ProblemDifficulty
  timeLimitMs?: number
  memoryLimitMb?: number
  starterPython?: string | null
  starterJs?: string | null
  tags: string[]
  testCases: TestCaseInput[]
}

export type GenerateProblemDraftInput = {
  prompt: string
  difficulty?: ProblemDifficulty
  inputMode?: "lines" | "json"
}

export type GeneratedProblemDraft = CreateProblemInput & {
  difficulty: ProblemDifficulty
  timeLimitMs: number
  memoryLimitMb: number
}

export type UpdateProblemInput = Partial<CreateProblemInput>

export type SampleTestCase = {
  id: string
  input: string
  expectedOutput: string
  order: number
}

export type ProblemDetail = {
  id: string
  title: string
  difficulty: ProblemDifficulty
  visibility: "private" | "pending" | "public"
  authorId: string
  author: string
  timeLimitMs: number
  memoryLimitMb: number
  tags: string[]
  createdAt: string
  reviewNote?: string | null
  statement: string
  starterPython: string | null
  starterJs: string | null
  sampleTests: SampleTestCase[]
  hiddenTests?: (SampleTestCase & { isSample: boolean })[]
}

export type SubmissionResult = {
  status: "accepted" | "wrong_answer" | "runtime_error" | "timeout" | "compile_error" | "unsupported"
  cases: {
    index: number
    passed: boolean
    expected?: string
    actual?: string
    error?: string
  }[]
  message?: string
  standings?: TournamentStandings
}

export type StandingsEntry = {
  rank: number
  userId: string
  displayName: string
  solved: number
  penalty: number
  score: number
  disqualified: boolean
  eloBefore?: number
  eloAfter?: number
  eloDelta?: number
}

export type TournamentStandings = {
  tournamentId: string
  updatedAt: string
  entries: StandingsEntry[]
}

export type PlayLanguage = "python" | "javascript"

export type TournamentTimerFields = {
  status: TournamentStatus
  durationMinutes: number
  liveStartedAt?: string | null
  pausedAt?: string | null
  resumeAt?: string | null
  pausedTotalMs?: number
  endedAt?: string | null
}

export type TournamentModerator = {
  id: string
  displayName: string
  email: string
  inviteStatus?: "pending" | "accepted"
}

export type ModeratorInviteItem = {
  inviteId: string
  tournamentId: string
  tournamentName: string
  hostDisplayName: string
  invitedAt: string
  tournamentStatus?: "Open" | "Soon" | "Live" | "Ended"
}

export type ModeratorInviteResolvedEvent = {
  tournamentId: string
  userId: string
  status: "accepted" | "declined" | "expired"
}

export type UserLookupItem = TournamentModerator

export type TournamentItem = {
  id: string
  name: string
  type: "1v1 Match" | "Free For All"
  date: string
  status: TournamentStatus
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
  liveStartedAt?: string | null
  pausedAt?: string | null
  resumeAt?: string | null
  pausedTotalMs?: number
  endedAt?: string | null
  endReason?: "host" | "timer" | "all_players_finished" | null
  viewerRole?: "host" | "player" | "mod" | null
  viewerDisqualified?: boolean
  viewerDisqualifyReason?: string | null
  viewerContestFinished?: boolean
  moderatorInvites?: Array<{
    id: string
    displayName: string
    email: string
    status: "pending"
  }>
  viewerModeratorInvitePending?: boolean
}

export type TournamentWarning = {
  id: string
  playerId: string
  playerDisplayName: string
  issuedById: string
  issuedByDisplayName: string
  reason: string
  createdAt: string
}

export type WarnPlayerResult = TournamentWarning & {
  playerWarningCount: number
  maxWarnings: number
  disqualified: boolean
}

export const MAX_TOURNAMENT_WARNINGS = 3

export type SuspensionRequestStatus = "pending" | "approved" | "rejected"

export type TournamentSuspensionRequest = {
  id: string
  playerId: string
  playerDisplayName: string
  requestedById: string
  requestedByDisplayName: string
  reason: string
  status: SuspensionRequestStatus
  decidedById: string | null
  decidedByDisplayName: string | null
  decisionNote: string | null
  decidedAt: string | null
  createdAt: string
}

export type TournamentDiscipline = {
  warnings: TournamentWarning[]
  suspensionRequests: TournamentSuspensionRequest[]
}

export type TournamentPlayerWarnedEvent = {
  tournamentId: string
  playerId: string
  reason: string
  issuedBy: string
  at: string
  warningCount: number
  maxWarnings: number
}

export type TournamentPlayerDisqualifiedEvent = {
  tournamentId: string
  playerId: string
  reason: string
  at: string
}

export type TournamentProblemItem = {
  problemId: string
  order: number
  points: number
  problem: ProblemDetail
}

export type TournamentCatalogUpdate =
  | { action: "created"; tournament: TournamentItem }
  | { action: "updated"; tournament: TournamentItem }
  | { action: "removed"; tournamentId: string }

export type TournamentEndReason = "host" | "timer" | "all_players_finished"

export type TournamentLiveState = {
  tournamentId: string
  status: TournamentStatus
  liveStartedAt: string | null
  pausedAt: string | null
  resumeAt: string | null
  pausedTotalMs: number
  endedAt: string | null
  endReason?: TournamentEndReason | null
  durationMinutes: number
}

export type TournamentProblemSetUpdate = {
  tournamentId: string
  problems: TournamentProblemItem[]
}

export type TournamentPlayerSession = {
  activeProblemId: string | null
  language: PlayLanguage
  updatedAt: string
}

export type TournamentWorkspaceEntry = {
  problemId: string
  sourceCode: string
  updatedAt: string
}

export type MyTournamentWorkspace = {
  session: TournamentPlayerSession
  entries: TournamentWorkspaceEntry[]
}

export type PlayerWorkspaceView = {
  userId: string
  displayName: string
  session: TournamentPlayerSession
  problemId: string
  sourceCode: string
  updatedAt: string
}

export type TournamentWorkspaceUpdate = {
  tournamentId: string
  userId: string
  displayName: string
  activeProblemId: string | null
  language: PlayLanguage
  problemId: string
  sourceCode: string
  updatedAt: string
}

export type ReportTargetType = "user" | "tournament" | "problem"
export type ReportCategory = "harassment" | "hate" | "sexual" | "spam" | "cheating" | "other"
export type ReportStatus = "open" | "resolved" | "dismissed"

export type CreateReportInput = {
  targetType: ReportTargetType
  targetId: string
  contextTournamentId?: string | null
  category: ReportCategory
  details: string
}

export type ReportItem = {
  id: string
  reporterId: string
  reporterDisplayName: string
  reporterEmail: string
  targetType: ReportTargetType
  targetId: string
  contextTournamentId: string | null
  category: ReportCategory
  details: string
  status: ReportStatus
  resolutionNote: string | null
  resolvedById: string | null
  resolvedAt: string | null
  createdAt: string
}

export type ModerationActionItem = {
  id: string
  actorId: string
  actorDisplayName: string
  subjectUserId: string
  type: "warn" | "suspend" | "unsuspend" | "promote" | "demote"
  note: string | null
  acknowledgedAt: string | null
  createdAt: string
}

export type AdminUserDetail = {
  user: UserProfile
  history: ModerationActionItem[]
  reports: ReportItem[]
  isSuperAdmin: boolean
}

export type ActivityLogItem = {
  id: string
  action: string
  actorType: "system" | "user"
  actorId: string | null
  actorDisplayName: string | null
  actorEmail: string | null
  targetType: string
  targetId: string
  tournamentId: string | null
  summary: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type ActivityLogFilters = {
  q?: string
  action?: string
  actorId?: string
  targetType?: string
  targetId?: string
  tournamentId?: string
  from?: string
  to?: string
  cursor?: string
  limit?: number
}

export type ActivityLogListResponse = {
  items: ActivityLogItem[]
  nextCursor: string | null
  actions: string[]
}

export type LobbyPlayer = {
  id: string
  displayName: string
  avatarUrl: string | null
  eloTournament: number
  role: "host" | "mod" | "player"
  joinedAt: string
  disqualified: boolean
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

export type FocusViolationEvent = {
  applied: boolean
  userId: string
  displayName: string
  deduction: number
  totalDeduction: number
  at: string
}

export type TournamentFocusViolationEvent = FocusViolationEvent & { tournamentId: string }

export type VersusFocusViolationEvent = FocusViolationEvent & { matchId: string }

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
  matchKind: "ranked" | "private"
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
  eloBefore?: number
  eloAfter?: number
  eloDelta?: number
}

export type ProfileHistoryPrivateItem = {
  kind: "private"
  matchId: string
  name: string
  endedAt: string
  difficulty: VersusDifficulty
  passwordProtected: boolean
  outcome: "aborted"
}

export type ProfileHistoryItem =
  | ProfileHistoryVersusItem
  | ProfileHistoryTournamentItem
  | ProfileHistoryPrivateItem

export type HostedPrivateRoomItem = {
  lobbyKind: "privateRoom"
  id: string
  name: string
  type: "1v1 Match"
  status: "Open" | "Live" | "Ended"
  players: number
  maxPlayers: 2
  passwordProtected: boolean
  createdAt: string
}

export type HostedTournamentLobbyItem = TournamentItem & { lobbyKind: "tournament" }

export type HostedLobbyItem = HostedTournamentLobbyItem | HostedPrivateRoomItem
