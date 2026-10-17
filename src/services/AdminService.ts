import ApiService from "./ApiService"
import type {
  ActivityLogFilters,
  ActivityLogListResponse,
  AdminDashboardSummary,
  AdminUserDetail,
  ReportItem,
  ReportStatus,
  UserProfile,
  UserRole,
  UserStatus,
} from "../types/api"

class AdminService extends ApiService {
  async getDashboardSummary(token: string | null) {
    return this.requestWithAuth<AdminDashboardSummary>("/api/admin/dashboard/summary", token)
  }

  async listReports(token: string | null, status: ReportStatus = "open") {
    return this.requestWithAuth<ReportItem[]>(`/api/admin/reports?status=${status}`, token)
  }

  async countOpenReports(token: string | null) {
    return this.requestWithAuth<{ count: number }>("/api/admin/reports/count", token)
  }

  async resolveReport(
    token: string | null,
    id: string,
    body: {
      resolution: "resolved" | "dismissed"
      note?: string
      suspendUser?: boolean
      suspendReason?: string
    },
  ) {
    return this.requestWithAuth<ReportItem>(`/api/admin/reports/${id}/resolve`, token, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async listUsers(
    token: string | null,
    query: { search?: string; status?: UserStatus; role?: UserRole } = {},
  ) {
    const params = new URLSearchParams()
    if (query.search) params.set("search", query.search)
    if (query.status) params.set("status", query.status)
    if (query.role) params.set("role", query.role)
    const qs = params.toString()
    return this.requestWithAuth<UserProfile[]>(`/api/admin/users${qs ? `?${qs}` : ""}`, token)
  }

  async getUser(token: string | null, id: string) {
    return this.requestWithAuth<AdminUserDetail>(`/api/admin/users/${id}`, token)
  }

  async warnUser(token: string | null, id: string, note: string) {
    return this.requestWithAuth<AdminUserDetail>(`/api/admin/users/${id}/warn`, token, {
      method: "POST",
      body: JSON.stringify({ note }),
    })
  }

  async suspendUser(token: string | null, id: string, reason: string) {
    return this.requestWithAuth<AdminUserDetail>(`/api/admin/users/${id}/suspend`, token, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  async unsuspendUser(token: string | null, id: string) {
    return this.requestWithAuth<AdminUserDetail>(`/api/admin/users/${id}/unsuspend`, token, {
      method: "POST",
    })
  }

  async setUserRole(token: string | null, id: string, role: UserRole) {
    return this.requestWithAuth<AdminUserDetail>(`/api/admin/users/${id}/role`, token, {
      method: "POST",
      body: JSON.stringify({ role }),
    })
  }

  async listActivityLogs(token: string | null, filters: ActivityLogFilters = {}) {
    const params = new URLSearchParams()
    if (filters.q) params.set("q", filters.q)
    if (filters.action) params.set("action", filters.action)
    if (filters.actorId) params.set("actorId", filters.actorId)
    if (filters.targetType) params.set("targetType", filters.targetType)
    if (filters.targetId) params.set("targetId", filters.targetId)
    if (filters.tournamentId) params.set("tournamentId", filters.tournamentId)
    if (filters.from) params.set("from", filters.from)
    if (filters.to) params.set("to", filters.to)
    if (filters.cursor) params.set("cursor", filters.cursor)
    if (filters.limit) params.set("limit", String(filters.limit))
    const qs = params.toString()
    return this.requestWithAuth<ActivityLogListResponse>(
      `/api/admin/activity-logs${qs ? `?${qs}` : ""}`,
      token,
    )
  }
}

export default new AdminService()
