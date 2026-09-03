import { QueryClient } from "@tanstack/react-query"

export const STALE_TIME = {
  catalog: 15_000,
  detail: 10_000,
  live: 0,
} as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.catalog,
      gcTime: 15 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
