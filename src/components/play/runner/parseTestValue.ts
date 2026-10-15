import JSON5 from "json5"

export type TestInputMode = "json" | "lines"

export function parseTestLiteral(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return raw

  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through to JSON5
  }

  try {
    return JSON5.parse(trimmed)
  } catch {
    // fall through to plain text
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    throw new Error(`Invalid object/array literal: ${trimmed}`)
  }

  const quote = trimmed[0]
  if ((quote === '"' || quote === "'") && trimmed.length >= 2 && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

export function parseTestValue(raw: string): unknown {
  try {
    return parseTestLiteral(raw)
  } catch {
    return raw
  }
}

export function parseArgLines(text: string): unknown[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim())
    .map(({ line, index }) => {
      try {
        return parseTestLiteral(line)
      } catch (error) {
        throw new Error(`Line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`, {
          cause: error,
        })
      }
    })
}

export function normalizeTestValue(text: string): string {
  if (!text.trim()) return ""
  return JSON.stringify(parseTestLiteral(text))
}

/** Stored inputs that parse to an array are spread as positional arguments, so a lone array value is wrapped. */
export function normalizeTestInput(text: string, mode: TestInputMode): string {
  if (mode === "lines") {
    const args = parseArgLines(text)
    if (args.length === 0) throw new Error("Enter at least one argument line")
    return JSON.stringify(args)
  }

  if (!text.trim()) return ""
  const value = parseTestLiteral(text)
  if (isMultilineText(value)) {
    throw new Error("Input has multiple lines. Switch the input format to Lines to pass each line as an argument.")
  }
  return JSON.stringify(Array.isArray(value) ? [value] : value)
}

function isMultilineText(value: unknown): value is string {
  return typeof value === "string" && value.includes("\n")
}

/** Multi-line text (including legacy raw inputs) is treated as one argument per line. */
export function toSolveArgs(storedInput: string): unknown[] {
  const value = parseTestValue(storedInput)
  if (Array.isArray(value)) return value
  if (isMultilineText(value)) {
    return value
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map(parseTestValue)
  }
  return [value]
}

export function isArgListInput(storedInput: string): boolean {
  const value = parseTestValue(storedInput)
  return Array.isArray(value) || isMultilineText(value)
}

export function formatArgLines(storedInput: string): string {
  return toSolveArgs(storedInput)
    .map((arg) => JSON.stringify(arg))
    .join("\n")
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

export function pythonLiteral(value: unknown): string {
  if (value === null || value === undefined) return "None"
  if (value === true) return "True"
  if (value === false) return "False"
  if (Array.isArray(value)) return `[${value.map(pythonLiteral).join(", ")}]`
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${pythonLiteral(item)}`)
    return `{${entries.join(", ")}}`
  }
  return JSON.stringify(value)
}
