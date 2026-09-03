function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

const adminEmails = parseAdminEmails(import.meta.env.VITE_ADMIN_EMAILS)

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails.has(email.trim().toLowerCase())
}
