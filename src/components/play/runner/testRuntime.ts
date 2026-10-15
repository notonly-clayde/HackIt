import { parseTestValue } from "./parseTestValue"

export type TestCaseResult = {
  name: string
  passed: boolean
  error?: string
}

export type TestRunResult = {
  passed: number
  failed: number
  results: TestCaseResult[]
  logs: string[]
  error?: string
}

type Matcher = {
  toBe(expected: unknown): void
  toEqual(expected: unknown): void
  toThrow(): void
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export const parseInput = parseTestValue

export function createTestRuntime() {
  const results: TestCaseResult[] = []
  const logs: string[] = []
  let currentSuite = ""

  const record = (name: string, fn: () => void) => {
    const fullName = currentSuite ? `${currentSuite} > ${name}` : name
    try {
      fn()
      results.push({ name: fullName, passed: true })
    } catch (error) {
      results.push({
        name: fullName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const describe = (name: string, fn: () => void) => {
    const previous = currentSuite
    currentSuite = currentSuite ? `${currentSuite} > ${name}` : name
    fn()
    currentSuite = previous
  }

  const it = (name: string, fn: () => void) => record(name, fn)
  const test = it

  const expect = (actual: unknown): Matcher => ({
    toBe(expected: unknown) {
      const pass = actual === expected
      if (!pass) {
        throw new Error(
          `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`,
        )
      }
    },
    toEqual(expected: unknown) {
      if (!deepEqual(actual, expected)) {
        throw new Error(
          `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`,
        )
      }
    },
    toThrow() {
      if (typeof actual !== "function") {
        throw new Error("Expected a function")
      }
      let threw = false
      try {
        ;(actual as () => void)()
      } catch {
        threw = true
      }
      if (!threw) {
        throw new Error("Expected function to throw")
      }
    },
  })

  const log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "))
  }

  const getResult = (): TestRunResult => {
    const failed = results.filter((item) => !item.passed).length
    return {
      passed: results.filter((item) => item.passed).length,
      failed,
      results,
      logs,
    }
  }

  return { describe, it, test, expect, log, parseInput, getResult, logs }
}

export function stripTestRuntimeImport(testCode: string): string {
  return testCode.replace(
    /import\s+\{[^}]+\}\s+from\s+['"]@hackit\/test-runtime['"];?\s*/g,
    "",
  )
}

export function buildBrowserTestBundle(solutionCode: string, testCode: string): string {
  const stripped = stripTestRuntimeImport(testCode)
  return `${solutionCode}\n\n${stripped}`
}
