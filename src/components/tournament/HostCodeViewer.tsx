import Editor from "@monaco-editor/react"
import Select from "../ui/Select"
import type { PlayLanguage, ProblemDetail } from "../../types/api"

type HostCodeViewerProps = {
  displayName: string
  userId: string
  problems: ProblemDetail[]
  problemId: string | null
  onProblemChange: (problemId: string) => void
  sourceCode: string
  language: PlayLanguage
}

function shortPlayerId(userId: string): string {
  return userId.slice(-4)
}

const HostCodeViewer = ({
  displayName,
  userId,
  problems,
  problemId,
  onProblemChange,
  sourceCode,
  language,
}: HostCodeViewerProps) => {
  const monacoLanguage = language === "cpp" ? "cpp" : language

  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-lg font-semibold text-accent">
            {displayName}{" "}
            <span className="text-muted font-normal">({shortPlayerId(userId)})</span>
          </p>
        </div>
        {problems.length > 0 && (
          <Select
            size="sm"
            value={problemId ?? ""}
            className="min-w-[14rem] w-full sm:w-[16rem]"
            aria-label="Problem"
            options={problems.map((problem, index) => ({
              value: problem.id,
              label: `${index + 1}. ${problem.title}`,
            }))}
            onChange={onProblemChange}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-border overflow-hidden bg-[#1e1e1e]">
        {problemId ? (
          <Editor
            height="100%"
            language={monacoLanguage}
            theme="vs-dark"
            value={sourceCode}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-sm px-6 text-center">
            This player has not opened a problem yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default HostCodeViewer
