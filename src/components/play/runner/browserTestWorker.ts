import { buildBrowserTestBundle, createTestRuntime } from "./testRuntime"
import type { TestRunResult } from "./testRuntime"

type WorkerRequest = {
  solutionCode: string
  testCode: string
  timeoutMs?: number
}

type WorkerResponse =
  | { ok: true; result: TestRunResult }
  | { ok: false; error: string }

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { solutionCode, testCode, timeoutMs = 5000 } = event.data

  const runtime = createTestRuntime()
  const { describe, it, test, expect, parseInput, getResult, log } = runtime
  const bundle = buildBrowserTestBundle(solutionCode, testCode)

  let finished = false

  const timeout = self.setTimeout(() => {
    if (finished) return
    finished = true
    const response: WorkerResponse = {
      ok: false,
      error: `Timed out after ${timeoutMs}ms`,
    }
    self.postMessage(response)
  }, timeoutMs)

  try {
    const runner = new Function(
      "describe",
      "it",
      "test",
      "expect",
      "parseInput",
      "console",
      `"use strict";\n${bundle}`,
    )
    runner(describe, it, test, expect, parseInput, { log })
    finished = true
    self.clearTimeout(timeout)
    const response: WorkerResponse = { ok: true, result: getResult() }
    self.postMessage(response)
  } catch (error) {
    finished = true
    self.clearTimeout(timeout)
    const response: WorkerResponse = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
    self.postMessage(response)
  }
}
