import { useEffect, useMemo, useState } from "react"
import { FaCheck } from "react-icons/fa6"
import { IoChevronDown, IoChevronForward } from "react-icons/io5"
import { MdErrorOutline } from "react-icons/md"
import type { PlayRunResultView } from "./runner/normalizeRunResult"
import { verdictLabels } from "./runner/normalizeRunResult"

type RunResultsPanelProps = {
  result: PlayRunResultView | null
  emptyMessage?: string
  runningMessage?: string
}

function defaultExpandedId(result: PlayRunResultView): string | null {
  if (result.cases.length === 0) return null
  const firstFail = result.cases.find((item) => !item.passed)
  return firstFail?.id ?? result.cases[0]?.id ?? null
}

const RunResultsPanel = ({
  result,
  emptyMessage = "Run your code to see sample test results.",
  runningMessage = "Running sample tests…",
}: RunResultsPanelProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!result || result.status === "running") {
      setExpandedId(null)
      return
    }
    setExpandedId(defaultExpandedId(result))
  }, [result])

  const allPassed = useMemo(
    () => result != null && result.failed === 0 && result.passed > 0,
    [result],
  )

  if (!result) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    )
  }

  if (result.status === "running") {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted animate-pulse">{runningMessage}</p>
      </div>
    )
  }

  const hasCases = result.cases.length > 0
  const accentClass = allPassed && hasCases ? "border-highlight" : "border-danger"

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {hasCases && (
        <p className="text-sm">
          <span className="text-highlight font-medium">Passed: {result.passed}</span>
          <span className="text-muted mx-2">·</span>
          <span className="text-danger font-medium">Failed: {result.failed}</span>
        </p>
      )}

      {result.message && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-accent">
          {verdictLabels[result.status]}: {result.message}
        </div>
      )}

      {hasCases && (
        <div>
          <div className={`flex items-center gap-2 border-l-4 pl-3 mb-3 ${accentClass}`}>
            <h2 className="text-sm font-semibold text-accent">Test Results</h2>
          </div>

          <div className="space-y-1">
            {result.cases.map((testCase) => {
              const expanded = expandedId === testCase.id
              const failed = !testCase.passed

              return (
                <div key={testCase.id} className="rounded-lg border border-border/80 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : testCase.id)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface/60 transition-colors"
                  >
                    {expanded ? (
                      <IoChevronDown className="shrink-0 text-muted" />
                    ) : (
                      <IoChevronForward className={`shrink-0 ${failed ? "text-danger" : "text-muted"}`} />
                    )}
                    <span className={failed ? "text-danger font-medium" : "text-accent"}>
                      {testCase.label}
                    </span>
                  </button>

                  {expanded && (
                    <div className="border-t border-border/60 px-3 py-2.5 bg-surface/30">
                      {testCase.passed ? (
                        <div className="flex items-center gap-2 text-sm text-highlight">
                          <FaCheck className="shrink-0" />
                          <span>Test Passed</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-start gap-2 text-danger">
                            <MdErrorOutline className="shrink-0 mt-0.5" />
                            <span>{testCase.error ?? "Test failed"}</span>
                          </div>
                          {testCase.expected != null && (
                            <p className="text-muted pl-6">
                              Expected: <span className="text-accent font-mono">{testCase.expected}</span>
                            </p>
                          )}
                          {testCase.actual != null && (
                            <p className="text-muted pl-6">
                              Got: <span className="text-accent font-mono">{testCase.actual}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result.logs && result.logs.length > 0 && (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted mb-2">Logs</p>
          <pre className="text-xs font-mono text-muted whitespace-pre-wrap bg-surface/50 rounded-lg p-3 border border-border">
            {result.logs.map((line) => `> ${line}`).join("\n")}
          </pre>
        </div>
      )}
    </div>
  )
}

export default RunResultsPanel
