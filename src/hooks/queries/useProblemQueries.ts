import { useQuery, useQueryClient, keepPreviousData, type QueryClient } from "@tanstack/react-query"
import ProblemService from "../../services/ProblemService"
import { queryKeys, type ProblemCatalogFilters } from "../../lib/queryKeys"
import { STALE_TIME } from "../../lib/queryClient"
import { unwrap } from "../../lib/unwrap"
import type { ProblemDetail } from "../../types/api"

export async function fetchProblemCatalog(filters: ProblemCatalogFilters = {}) {
  return unwrap(await ProblemService.listCatalog(null, filters))
}

export function useProblemCatalog(
  token: string | null,
  filters: ProblemCatalogFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.problems.catalog(filters),
    queryFn: async () => unwrap(await ProblemService.listCatalog(token, filters)),
    enabled: Boolean(token) && enabled,
    staleTime: STALE_TIME.catalog,
    placeholderData: keepPreviousData,
  })
}

export function useMyProblems(token: string | null) {
  return useQuery({
    queryKey: queryKeys.problems.mine(),
    queryFn: async () => unwrap(await ProblemService.listMine(token)),
    enabled: Boolean(token),
    staleTime: STALE_TIME.catalog,
    placeholderData: keepPreviousData,
  })
}

export function useProblemDetail(id: string | undefined, token: string | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.problems.detail(id ?? ""),
    queryFn: async () => unwrap(await ProblemService.getById(token, id!)),
    enabled: Boolean(id) && Boolean(token),
    staleTime: STALE_TIME.detail,
    placeholderData: () => {
      if (!id) return undefined
      const catalogs = queryClient.getQueriesData<ProblemDetail[]>({
        queryKey: queryKeys.problems.catalogs(),
      })
      for (const [, data] of catalogs) {
        const found = data?.find((p) => p.id === id)
        if (found) return found
      }
      const mine = queryClient.getQueryData<ProblemDetail[]>(queryKeys.problems.mine())
      return mine?.find((p) => p.id === id)
    },
  })
}

export function useAdminProblems(token: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.problems(),
    queryFn: async () => unwrap(await ProblemService.listPendingAdmin(token)),
    enabled: Boolean(token) && enabled,
    staleTime: STALE_TIME.catalog,
    placeholderData: keepPreviousData,
  })
}

export function prefetchProblemCatalog(queryClient: QueryClient, token: string | null) {
  if (!token) return Promise.resolve()
  return queryClient.prefetchQuery({
    queryKey: queryKeys.problems.catalog({}),
    queryFn: async () => unwrap(await ProblemService.listCatalog(token, {})),
    staleTime: STALE_TIME.catalog,
  })
}

export function prefetchProblemDetail(
  queryClient: QueryClient,
  id: string,
  token: string | null,
) {
  if (!token) return Promise.resolve()
  return queryClient.prefetchQuery({
    queryKey: queryKeys.problems.detail(id),
    queryFn: async () => unwrap(await ProblemService.getById(token, id)),
    staleTime: STALE_TIME.detail,
  })
}
