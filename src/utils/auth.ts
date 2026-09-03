import { createInternalNeonAuth } from "@neondatabase/neon-js/auth"
import { BetterAuthVanillaAdapter } from "@neondatabase/neon-js/auth/vanilla/adapters"

const neonAuth = createInternalNeonAuth(import.meta.env.VITE_NEON_AUTH_URL, {
  adapter: BetterAuthVanillaAdapter({
    fetchOptions: {
      credentials: "include",
    },
  }),
})

export const authClient = neonAuth.adapter

function decodeJwtExpiration(token: string): number | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1])) as { exp?: unknown }
    return typeof payload.exp === "number" ? payload.exp : null
  } catch {
    return null
  }
}

function isJwtFresh(token: string, skewSeconds = 60): boolean {
  const exp = decodeJwtExpiration(token)
  if (!exp) return false
  return exp * 1000 > Date.now() + skewSeconds * 1000
}

export async function getAuthJwt(forceRefresh = false): Promise<string | null> {
  const session = await authClient.getSession()
  if (!session.data?.session) return null

  const cachedToken = session.data.session.token
  if (!forceRefresh && cachedToken && isJwtFresh(cachedToken)) {
    return cachedToken
  }

  const tokenResult = await authClient.token()
  if (tokenResult.data?.token) {
    return tokenResult.data.token
  }

  return cachedToken ?? null
}
