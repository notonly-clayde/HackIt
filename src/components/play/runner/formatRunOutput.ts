import type { SubmissionResult } from "../../../types/api"
import type { TestRunResult } from "./testRuntime"

export function formatBrowserRunResult(result: TestRunResult): string {
  if (result.error) {
    return result.error
  }

  const lines = result.results.map((item) => {
    if (item.passed) return `✓ ${item.name}`
    return `✗ ${item.name}${item.error ? `\n  ${item.error}` : ""}`
  })

  if (result.logs.length > 0) {
    lines.push("", ...result.logs.map((line) => `> ${line}`))
  }

  lines.push("", `${result.passed} passed, ${result.failed} failed`)
  return lines.join("\n")
}

export function formatSubmissionResult(result: SubmissionResult): string {
  const statusLabel: Record<SubmissionResult["status"], string> = {
    accepted: "Accepted",
    wrong_answer: "Wrong Answer",
    runtime_error: "Runtime Error",
    timeout: "Time Limit Exceeded",
    compile_error: "Compile Error",
    unsupported: "Unsupported",
  }

  const lines = [statusLabel[result.status]]

  if (result.message) {
    lines.push(result.message)
  }

  for (const testCase of result.cases) {
    if (testCase.passed) {
      lines.push(`✓ Case ${testCase.index}`)
      continue
    }

    lines.push(`✗ Case ${testCase.index}`)
    if (testCase.error) lines.push(`  ${testCase.error}`)
    if (testCase.expected != null) lines.push(`  expected: ${testCase.expected}`)
    if (testCase.actual != null) lines.push(`  actual: ${testCase.actual}`)
  }

  return lines.join("\n")
}

export function submissionTone(
  result: SubmissionResult,
): "success" | "error" | "warn" {
  if (result.status === "accepted") return "success"
  if (result.status === "timeout" || result.status === "unsupported") return "warn"
  return "error"
}
