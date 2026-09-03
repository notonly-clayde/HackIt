import ApiService from "./ApiService"
import type {
  CreateProblemInput,
  ProblemDetail,
  ProblemDifficulty,
  SubmissionResult,
  UpdateProblemInput,
} from "../types/api"

type ProblemListQuery = {
  search?: string
  difficulty?: ProblemDifficulty
  tag?: string
}

class ProblemService extends ApiService {
  async listCatalog(token: string | null, query: ProblemListQuery = {}) {
    const params = new URLSearchParams()
    if (query.search) params.set("search", query.search)
    if (query.difficulty) params.set("difficulty", query.difficulty)
    if (query.tag) params.set("tag", query.tag)
    const qs = params.toString()

    return this.requestWithAuth<ProblemDetail[]>(`/api/problems${qs ? `?${qs}` : ""}`, token)
  }

  async listMine(token: string | null) {
    return this.requestWithAuth<ProblemDetail[]>(`/api/problems/mine`, token)
  }

  async getById(token: string | null, id: string) {
    return this.requestWithAuth<ProblemDetail>(`/api/problems/${id}`, token)
  }

  async create(token: string | null, input: CreateProblemInput) {
    return this.requestWithAuth<ProblemDetail>(`/api/problems`, token, {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async update(token: string | null, id: string, input: UpdateProblemInput) {
    return this.requestWithAuth<ProblemDetail>(`/api/problems/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  }

  async submitForReview(token: string | null, id: string) {
    return this.requestWithAuth<ProblemDetail>(`/api/problems/${id}/submit-review`, token, {
      method: "POST",
    })
  }

  async listPendingAdmin(token: string | null) {
    return this.requestWithAuth<ProblemDetail[]>(`/api/admin/problems`, token)
  }

  async approve(token: string | null, id: string) {
    return this.requestWithAuth<{ id: string; title: string }>(`/api/admin/problems/${id}/approve`, token, {
      method: "POST",
    })
  }

  async reject(token: string | null, id: string, reason: string) {
    return this.requestWithAuth<{ id: string; title: string }>(`/api/admin/problems/${id}/reject`, token, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  async unpublish(token: string | null, id: string) {
    return this.requestWithAuth<{ id: string; title: string }>(`/api/admin/problems/${id}/unpublish`, token, {
      method: "POST",
    })
  }

  async runSolution(token: string | null, problemId: string, body: { language: string; sourceCode: string }) {
    return this.requestWithAuth<SubmissionResult>(`/api/problems/${problemId}/run`, token, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async submitSolution(token: string | null, problemId: string, body: { language: string; sourceCode: string }) {
    return this.requestWithAuth<SubmissionResult>(`/api/problems/${problemId}/submit`, token, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }
}

export default new ProblemService()
