import { useState } from "react"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { SelectField, TextAreaField } from "../ui/Field"
import type { ProblemDifficulty } from "../../types/api"
import type { TestInputMode } from "../play/runner/parseTestValue"

type ProblemAiGenerateModalProps = {
  open: boolean
  inputMode: TestInputMode
  busy?: boolean
  onClose: () => void
  onGenerate: (payload: { prompt: string; difficulty?: ProblemDifficulty }) => void
}

const ProblemAiGenerateModal = ({
  open,
  inputMode,
  busy = false,
  onClose,
  onGenerate,
}: ProblemAiGenerateModalProps) => {
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState<ProblemDifficulty | "">("")

  const handleGenerate = () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    onGenerate({
      prompt: trimmed,
      difficulty: difficulty || undefined,
    })
  }

  const handleClose = () => {
    if (busy) return
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      kicker="Authoring"
      title="Generate problem with AI"
      description="Describe the topic or idea. The draft uses your current test input format and fills the form for you to review before saving."
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerate} disabled={busy || !prompt.trim()}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <TextAreaField
          label="Topic or prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Two Sum variant on a sorted array with unique pairs only"
          rows={4}
          maxLength={500}
        />
        <SelectField
          label="Preferred difficulty (optional)"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty | "")}
        >
          <option value="">Let AI decide</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </SelectField>
        <p className="text-xs text-muted">
          Test cases will use{" "}
          <span className="text-accent">{inputMode === "lines" ? "lines (one argument per line)" : "JSON input"}</span>
          , matching the form setting below.
        </p>
      </div>
    </Modal>
  )
}

export default ProblemAiGenerateModal
