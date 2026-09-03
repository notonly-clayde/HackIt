import type { SampleTestCase } from "../../types/api"

type SampleTestCasesProps = {
  tests: SampleTestCase[]
  className?: string
  caseLabel?: string
}

const SampleTestCases = ({ tests, className = "", caseLabel = "Sample" }: SampleTestCasesProps) => {
  if (tests.length === 0) {
    return <p className="text-muted text-sm">No {caseLabel.toLowerCase()} tests provided.</p>
  }

  const sorted = [...tests].sort((a, b) => a.order - b.order)

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {sorted.map((test, index) => (
        <div key={test.id} className="rounded-xl border border-border px-4 py-3">
          <p className="text-sm font-medium text-accent mb-2">
            {caseLabel} {index + 1}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted mb-1">Input</p>
              <pre className="rounded-lg bg-surface-2 px-3 py-2 text-xs overflow-x-auto whitespace-pre-wrap">
                {test.input || "(empty)"}
              </pre>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Expected output</p>
              <pre className="rounded-lg bg-surface-2 px-3 py-2 text-xs overflow-x-auto whitespace-pre-wrap">
                {test.expectedOutput || "(empty)"}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SampleTestCases
