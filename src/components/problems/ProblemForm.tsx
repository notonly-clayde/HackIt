import { useState } from "react"
import Button from "../ui/Button"
import Field, { SelectField, TextAreaField } from "../ui/Field"
import { useToast } from "../../contexts/ToastContext"
import StatementMarkdownEditor from "./StatementMarkdownEditor"
import type { CreateProblemInput, ProblemDifficulty, TestCaseInput } from "../../types/api"

type ProblemFormProps = {
  initial?: Partial<CreateProblemInput>
  submitLabel: string
  onSubmit: (input: CreateProblemInput) => Promise<void>
  onCancel: () => void
}

const emptyTest = (isSample: boolean): TestCaseInput => ({
  input: "",
  expectedOutput: "",
  isSample,
  order: 0,
})

const ProblemForm = ({ initial, submitLabel, onSubmit, onCancel }: ProblemFormProps) => {
  const toast = useToast()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [statement, setStatement] = useState(initial?.statement ?? "")
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>(initial?.difficulty ?? "medium")
  const [timeLimitMs, setTimeLimitMs] = useState(String(initial?.timeLimitMs ?? 2000))
  const [memoryLimitMb, setMemoryLimitMb] = useState(String(initial?.memoryLimitMb ?? 256))
  const [starterPython, setStarterPython] = useState(initial?.starterPython ?? "")
  const [starterJs, setStarterJs] = useState(initial?.starterJs ?? "")
  const [starterCpp, setStarterCpp] = useState(initial?.starterCpp ?? "")
  const [sampleTests, setSampleTests] = useState<TestCaseInput[]>(
    initial?.testCases?.filter((t) => t.isSample) ?? [emptyTest(true)],
  )
  const [hiddenTests, setHiddenTests] = useState<TestCaseInput[]>(
    initial?.testCases?.filter((t) => !t.isSample) ?? [emptyTest(false)],
  )
  const [submitting, setSubmitting] = useState(false)

  const updateTest = (
    list: TestCaseInput[],
    setList: (v: TestCaseInput[]) => void,
    index: number,
    field: keyof TestCaseInput,
    value: string | boolean,
  ) => {
    setList(list.map((test, i) => (i === index ? { ...test, [field]: value } : test)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const testCases = [
      ...sampleTests.map((test, index) => ({ ...test, isSample: true, order: index })),
      ...hiddenTests.map((test, index) => ({ ...test, isSample: false, order: index })),
    ]

    try {
      await onSubmit({
        title: title.trim(),
        statement: statement.trim(),
        difficulty,
        timeLimitMs: Number(timeLimitMs),
        memoryLimitMb: Number(memoryLimitMb),
        starterPython: starterPython.trim() || null,
        starterJs: starterJs.trim() || null,
        starterCpp: starterCpp.trim() || null,
        testCases,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save problem")
    } finally {
      setSubmitting(false)
    }
  }

  const renderTests = (
    label: string,
    tests: TestCaseInput[],
    setTests: (v: TestCaseInput[]) => void,
    isSample: boolean,
  ) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-accent">{label}</p>
        <Button
          type="button"
          variant="ghost"
          className="!py-1 !px-2 text-xs"
          onClick={() => setTests([...tests, emptyTest(isSample)])}
        >
          Add case
        </Button>
      </div>
      {tests.map((test, index) => (
        <div key={`${label}-${index}`} className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted uppercase tracking-wider">Case {index + 1}</span>
            {tests.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="!py-0.5 !px-2 text-xs text-danger"
                onClick={() => setTests(tests.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            )}
          </div>
          <TextAreaField
            label="Input"
            value={test.input}
            onChange={(e) => updateTest(tests, setTests, index, "input", e.target.value)}
            rows={2}
          />
          <TextAreaField
            label="Expected output"
            value={test.expectedOutput}
            onChange={(e) => updateTest(tests, setTests, index, "expectedOutput", e.target.value)}
            rows={2}
          />
        </div>
      ))}
    </div>
  )

  return (
    <form className="flex flex-col gap-5 lg:gap-6" onSubmit={handleSubmit}>
      <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <StatementMarkdownEditor
        value={statement}
        onChange={setStatement}
        required
        rows={10}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </SelectField>
        <Field
          label="Time limit (ms)"
          type="number"
          min={100}
          max={30000}
          value={timeLimitMs}
          onChange={(e) => setTimeLimitMs(e.target.value)}
          required
        />
        <Field
          label="Memory (MB)"
          type="number"
          min={16}
          max={1024}
          value={memoryLimitMb}
          onChange={(e) => setMemoryLimitMb(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <TextAreaField
          label="Python starter (optional)"
          value={starterPython}
          onChange={(e) => setStarterPython(e.target.value)}
          rows={3}
        />
        <TextAreaField
          label="JavaScript starter (optional)"
          value={starterJs}
          onChange={(e) => setStarterJs(e.target.value)}
          rows={3}
        />
        <TextAreaField
          label="C++ starter (optional)"
          value={starterCpp}
          onChange={(e) => setStarterCpp(e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-8">
        {renderTests("Sample tests (shown to players)", sampleTests, setSampleTests, true)}
        {renderTests("Hidden tests (judge only)", hiddenTests, setHiddenTests, false)}
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button type="button" variant="secondary" className="sm:flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="sm:flex-1" disabled={submitting || !title.trim() || !statement.trim()}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default ProblemForm
