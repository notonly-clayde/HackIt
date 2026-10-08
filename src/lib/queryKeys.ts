import type { ProblemDifficulty, TournamentStatus } from "../types/api"

export type TournamentListFilters = {
  search?: string
  type?: "ffa" | "1v1"
  status?: TournamentStatus
}

export type ProblemCatalogFilters = {
  search?: string
  difficulty?: ProblemDifficulty
  tag?: string
}

export const queryKeys = {
  tournaments: {
    all: ["tournaments"] as const,
    lists: () => [...queryKeys.tournaments.all, "list"] as const,
    list: (filters: TournamentListFilters = {}) =>
      [...queryKeys.tournaments.lists(), filters] as const,
    details: () => [...queryKeys.tournaments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tournaments.details(), id] as const,
    standings: (id: string) => [...queryKeys.tournaments.all, "standings", id] as const,
    problems: (id: string) => [...queryKeys.tournaments.all, "problems", id] as const,
    workspace: (id: string) => [...queryKeys.tournaments.all, "workspace", id] as const,
    playerWorkspace: (tournamentId: string, userId: string, problemId?: string) =>
      [...queryKeys.tournaments.all, "playerWorkspace", tournamentId, userId, problemId ?? ""] as const,
  },
  problems: {
    all: ["problems"] as const,
    catalogs: () => [...queryKeys.problems.all, "catalog"] as const,
    catalog: (filters: ProblemCatalogFilters = {}) =>
      [...queryKeys.problems.catalogs(), filters] as const,
    mine: () => [...queryKeys.problems.all, "mine"] as const,
    details: () => [...queryKeys.problems.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.problems.details(), id] as const,
  },
  admin: {
    problems: () => ["admin", "problems"] as const,
    reports: (status = "open") => ["admin", "reports", status] as const,
    reportCount: () => ["admin", "reports", "count"] as const,
    users: (filters: { search?: string; status?: string; role?: string } = {}) =>
      ["admin", "users", filters] as const,
    user: (id: string) => ["admin", "user", id] as const,
    activityLogs: (filters: Record<string, string | undefined> = {}) =>
      ["admin", "activity-logs", filters] as const,
  },
  users: {
    public: (id: string) => ["users", "public", id] as const,
    history: (id: string) => ["users", "history", id] as const,
  },
}
