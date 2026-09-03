import ApiService from "./ApiService"
import type {
  CreateReportInput,
  PublicUserProfile,
  UpdateUserProfileInput,
  UserProfile,
} from "../types/api"

class UserService extends ApiService {
  async bootstrap(token: string | null, emailVerified?: boolean) {
    return this.requestWithAuth<UserProfile>("/api/auth/bootstrap", token, {
      method: "POST",
      body: JSON.stringify({ emailVerified }),
    })
  }

  async getMe(token: string | null) {
    return this.requestWithAuth<UserProfile>("/api/users/me", token)
  }

  async getPublic(token: string | null, id: string) {
    return this.requestWithAuth<PublicUserProfile>(`/api/users/${id}`, token)
  }

  async updateMe(token: string | null, input: UpdateUserProfileInput) {
    return this.requestWithAuth<UserProfile>("/api/users/me", token, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  }

  async acknowledgeWarn(token: string | null, warnId: string) {
    return this.requestWithAuth(`/api/users/me/warns/${warnId}/acknowledge`, token, {
      method: "POST",
    })
  }

  async createReport(token: string | null, input: CreateReportInput) {
    return this.requestWithAuth("/api/reports", token, {
      method: "POST",
      body: JSON.stringify(input),
    })
  }
}

export default new UserService()
