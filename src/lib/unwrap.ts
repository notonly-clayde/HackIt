/** Convert [data, err] service tuples into thrown errors for TanStack Query. */
export function unwrap<T>(result: [T | null, string | undefined]): T {
  const [data, err] = result
  if (err) throw new Error(err)
  if (data === null) throw new Error("No data returned")
  return data
}

export function unwrapNullable<T>(result: [T | null, string | undefined]): T | null {
  const [data, err] = result
  if (err) throw new Error(err)
  return data
}
