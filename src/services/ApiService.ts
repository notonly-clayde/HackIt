import Service from "./Service"
import { getAuthJwt } from "../utils/auth"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export default class ApiService extends Service {
  protected baseUrl = API_URL.replace(/\/$/, "")

  protected async requestWithAuth<T>(
    uri: string,
    _token: string | null,
    options?: RequestInit,
  ): Promise<[T | null, string | undefined]> {
    const token = await getAuthJwt()
    if (!token) {
      return [null, "Not authenticated"]
    }

    const result = await this.request<T>(`${this.baseUrl}${uri}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    })

    if (result[1]?.includes("Invalid or expired token")) {
      const refreshed = await getAuthJwt(true)
      if (refreshed && refreshed !== token) {
        return this.request<T>(`${this.baseUrl}${uri}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshed}`,
            ...(options?.headers ?? {}),
          },
        })
      }
    }

    return result
  }

  protected async requestPublic<T>(uri: string, options?: RequestInit): Promise<[T | null, string | undefined]> {
    return this.request<T>(`${this.baseUrl}${uri}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    })
  }
}
