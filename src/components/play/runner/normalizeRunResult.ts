import type { SubmissionResult } from "../../../types/api"
import type { TestRunResult } from "./testRuntime"

export type PlayCaseResult = {
  id: string
  label: string
  passed: boolean
  error?: string
  expected?: string
  actual?: string
}

export type PlayRunResultView = {
  kind: "run" | "submit"
  status: SubmissionResult["status"] | "running" | "error"
  message?: string
  passed: number
  failed: number
  cases: PlayCaseResult[]
  logs?: string[]
  at: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function deriveStatus(
  passed: number,
  failed: number,
  apiStatus?: SubmissionResult["status"],
): SubmissionResult["status"] | "error" {
  if (apiStatus) return apiStatus
  if (failed > 0) return "wrong_answer"
  if (passed > 0) return "accepted"
  return "error"
}

export function createRunningResult(kind: "run" | "submit"): PlayRunResultView {
  return {
    kind,
    status: "running",
    passed: 0,
    failed: 0,
    cases: [],
    at: nowIso(),
  }
}

export function createErrorResult(kind: "run" | "submit", message: string): PlayRunResultView {
  return {
    kind,
    status: "error",
    message,
    passed: 0,
    failed: 0,
    cases: [],
    at: nowIso(),
  }
}

export function normalizeBrowserRunResult(result: TestRunResult): PlayRunResultView {
  if (result.error) {
    return {
      kind: "run",
      status: "runtime_error",
      message: result.error,
      passed: result.passed,
      failed: result.failed,
      cases: result.results.map((item, index) => ({
        id: String(index + 1),
        label: `Test Case ${index + 1}`,
        passed: item.passed,
        error: item.error,
      })),
      logs: result.logs.length > 0 ? result.logs : undefined,
      at: nowIso(),
    }
  }

  const cases: PlayCaseResult[] = result.results.map((item, index) => ({
    id: String(index + 1),
    label: item.name || `Test Case ${index + 1}`,
    passed: item.passed,
    error: item.error,
  }))

  return {
    kind: "run",
    status: deriveStatus(result.passed, result.failed),
    passed: result.passed,
    failed: result.failed,
    cases,
    logs: result.logs.length > 0 ? result.logs : undefined,
    at: nowIso(),
  }
}

export function normalizeSubmissionResult(
  result: SubmissionResult,
  kind: "run" | "submit",
): PlayRunResultView {
  const cases: PlayCaseResult[] = result.cases.map((item) => ({
    id: String(item.index),
    label: `Test Case ${item.index}`,
    passed: item.passed,
    error: item.error,
    expected: item.expected,
    actual: item.actual,
  }))

  const passed = cases.filter((item) => item.passed).length
  const failed = cases.filter((item) => !item.passed).length

  return {
    kind,
    status: result.status,
    message: result.message,
    passed,
    failed,
    cases,
    at: nowIso(),
  }
}

export const verdictLabels: Record<PlayRunResultView["status"], string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  timeout: "Time Limit Exceeded",
  compile_error: "Compile Error",
  unsupported: "Unsupported",
  running: "Running…",
  error: "Error",
}
