export function parseTestValue(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return raw

  try {
    return JSON.parse(trimmed)
  } catch {
    return raw
  }
}

export function formatTestValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  return JSON.stringify(value)
}

export function testValuesEqual(actual: unknown, expected: unknown): boolean {
  const actualIsObject = typeof actual === "object" && actual !== null
  const expectedIsObject = typeof expected === "object" && expected !== null

  if (actualIsObject || expectedIsObject) {
    return JSON.stringify(actual) === JSON.stringify(expected)
  }

  return String(actual).trim() === String(expected).trim()
}

export function isStructuredValue(value: unknown): boolean {
  return typeof value === "object" && value !== null
}

export function jsLiteral(value: unknown): string {
  return JSON.stringify(value)
}

export function pythonJsonLiteral(raw: string): string {
  return JSON.stringify(raw)
}
