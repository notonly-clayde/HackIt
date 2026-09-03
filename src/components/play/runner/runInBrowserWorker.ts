import type { TestRunResult } from "./testRuntime"

export async function runTestsInBrowserWorker(
  solutionCode: string,
  testCode: string,
  timeoutMs = 5000,
): Promise<TestRunResult> {
  const worker = new Worker(new URL("./browserTestWorker.ts", import.meta.url), {
    type: "module",
  })

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.terminate()
    }

    worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: TestRunResult; error?: string }>) => {
      cleanup()
      if (event.data.ok && event.data.result) {
        resolve(event.data.result)
        return
      }
      resolve({
        passed: 0,
        failed: 1,
        results: [],
        logs: [],
        error: event.data.error ?? "Test run failed",
      })
    }

    worker.onerror = (error) => {
      cleanup()
      reject(error)
    }

    worker.postMessage({ solutionCode, testCode, timeoutMs })
  })
}
