import ApiService from "./ApiService"
import type {
  SubmissionResult,
  VersusMatch,
  VersusMatchEnded,
  VersusReview,
  VersusSubmissionResult,
} from "../types/api"

class VersusService extends ApiService {
  async getMatch(token: string | null, matchId: string) {
    return this.requestWithAuth<VersusMatch>(`/api/versus/matches/${matchId}`, token)
  }

  async getReview(token: string | null, matchId: string) {
    return this.requestWithAuth<VersusReview>(`/api/versus/matches/${matchId}/review`, token)
  }

  async runSolution(
    token: string | null,
    matchId: string,
    body: { language: string; sourceCode: string },
  ) {
    return this.requestWithAuth<SubmissionResult>(`/api/versus/matches/${matchId}/run`, token, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async submitSolution(
    token: string | null,
    matchId: string,
    body: { language: string; sourceCode: string },
  ) {
    return this.requestWithAuth<VersusSubmissionResult>(
      `/api/versus/matches/${matchId}/submit`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    )
  }

  async leave(token: string | null, matchId: string) {
    return this.requestWithAuth<VersusMatchEnded>(`/api/versus/matches/${matchId}/leave`, token, {
      method: "POST",
    })
  }
}

export default new VersusService()
