import ApiService from "./ApiService"
import type {
  CreateTournamentInput,
  CreateProblemInput,
  SubmissionResult,
  TournamentItem,
  TournamentProblemItem,
  TournamentStandings,
  MyTournamentWorkspace,
  PlayerWorkspaceView,
  UpdateTournamentInput,
} from "../types/api"

type TournamentListQuery = {
  search?: string
  type?: "ffa" | "1v1"
  status?: "Open" | "Soon" | "Live" | "Ended"
}

class TournamentService extends ApiService {
  async list(query: TournamentListQuery = {}) {
    const params = new URLSearchParams()

    if (query.search) params.set("search", query.search)
    if (query.type) params.set("type", query.type)
    if (query.status) params.set("status", query.status)

    const qs = params.toString()
    return this.requestPublic<TournamentItem[]>(`/api/tournaments${qs ? `?${qs}` : ""}`)
  }

  async getById(id: string, token?: string | null) {
    if (token) {
      return this.requestWithAuth<TournamentItem>(`/api/tournaments/${id}`, token)
    }
    return this.requestPublic<TournamentItem>(`/api/tournaments/${id}`)
  }

  async create(token: string | null, input: CreateTournamentInput) {
    return this.requestWithAuth<TournamentItem>("/api/tournaments", token, {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async update(token: string | null, id: string, input: UpdateTournamentInput) {
    return this.requestWithAuth<TournamentItem>(`/api/tournaments/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  }

  async remove(token: string | null, id: string) {
    return this.requestWithAuth<null>(`/api/tournaments/${id}`, token, {
      method: "DELETE",
    })
  }

  async verifyPassword(token: string | null, id: string, password: string) {
    return this.requestWithAuth<{ ok: true }>(`/api/tournaments/${id}/verify-password`, token, {
      method: "POST",
      body: JSON.stringify({ password }),
    })
  }

  async listProblems(token: string | null, tournamentId: string) {
    return this.requestWithAuth<TournamentProblemItem[]>(`/api/tournaments/${tournamentId}/problems`, token)
  }

  async attachProblem(
    token: string | null,
    tournamentId: string,
    body: { problemId?: string; points?: number; problem?: CreateProblemInput },
  ) {
    return this.requestWithAuth<TournamentProblemItem[]>(`/api/tournaments/${tournamentId}/problems`, token, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async detachProblem(token: string | null, tournamentId: string, problemId: string) {
    return this.requestWithAuth<TournamentProblemItem[]>(
      `/api/tournaments/${tournamentId}/problems/${problemId}`,
      token,
      { method: "DELETE" },
    )
  }

  async reorderProblems(
    token: string | null,
    tournamentId: string,
    order: { problemId: string; order: number }[],
  ) {
    return this.requestWithAuth<TournamentProblemItem[]>(
      `/api/tournaments/${tournamentId}/problems/reorder`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({ order }),
      },
    )
  }

  async start(token: string | null, id: string) {
    return this.requestWithAuth<TournamentItem>(`/api/tournaments/${id}/start`, token, {
      method: "POST",
    })
  }

  async pause(token: string | null, id: string) {
    return this.requestWithAuth<TournamentItem>(`/api/tournaments/${id}/pause`, token, {
      method: "POST",
    })
  }

  async resume(token: string | null, id: string) {
    return this.requestWithAuth<TournamentItem>(`/api/tournaments/${id}/resume`, token, {
      method: "POST",
    })
  }

  async end(token: string | null, id: string) {
    return this.requestWithAuth<TournamentItem>(`/api/tournaments/${id}/end`, token, {
      method: "POST",
    })
  }

  async runSolution(
    token: string | null,
    tournamentId: string,
    problemId: string,
    body: { language: string; sourceCode: string },
  ) {
    return this.requestWithAuth<SubmissionResult>(
      `/api/tournaments/${tournamentId}/problems/${problemId}/run`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    )
  }

  async getStandings(id: string, token?: string | null) {
    if (token) {
      return this.requestWithAuth<TournamentStandings>(`/api/tournaments/${id}/standings`, token)
    }
    return this.requestPublic<TournamentStandings>(`/api/tournaments/${id}/standings`)
  }

  async getMyWorkspace(token: string | null, tournamentId: string) {
    return this.requestWithAuth<MyTournamentWorkspace>(
      `/api/tournaments/${tournamentId}/workspace/me`,
      token,
    )
  }

  async saveMyWorkspace(
    token: string | null,
    tournamentId: string,
    body: {
      problemId?: string
      sourceCode?: string
      activeProblemId?: string | null
      language?: string
    },
  ) {
    return this.requestWithAuth<MyTournamentWorkspace>(
      `/api/tournaments/${tournamentId}/workspace/me`,
      token,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    )
  }

  async getPlayerWorkspace(
    token: string | null,
    tournamentId: string,
    userId: string,
    problemId?: string,
  ) {
    const qs = problemId ? `?problemId=${encodeURIComponent(problemId)}` : ""
    return this.requestWithAuth<PlayerWorkspaceView>(
      `/api/tournaments/${tournamentId}/workspace/players/${userId}${qs}`,
      token,
    )
  }

  async submitSolution(
    token: string | null,
    tournamentId: string,
    problemId: string,
    body: { language: string; sourceCode: string },
  ) {
    return this.requestWithAuth<SubmissionResult>(
      `/api/tournaments/${tournamentId}/problems/${problemId}/submit`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    )
  }
}

export default new TournamentService()
