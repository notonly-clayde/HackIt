import type { User } from "@neondatabase/neon-js/auth/types"
import type { UserProfile } from "../types/api"
import { isAdminEmail } from "./adminEmails"

export function isEmailVerifiedForAccess(
  user: Pick<User, "emailVerified" | "email"> | null | undefined,
  profile: Pick<UserProfile, "emailVerified" | "role"> | null | undefined,
): boolean {
  if (isAdminEmail(user?.email)) return true
  if (profile?.role === "admin") return true
  if (user?.emailVerified) return true
  if (profile?.emailVerified) return true
  return false
}
