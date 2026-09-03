import { useState } from "react"
import Button from "../ui/Button"
import Field, { SelectField, TextAreaField } from "../ui/Field"
import { useToast } from "../../contexts/ToastContext"
import { PROBLEM_TAG_OPTIONS, type ProblemTagSlug } from "../../lib/problemTags"
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

const MAX_TAGS = 5

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
  const [tags, setTags] = useState<ProblemTagSlug[]>(
    (initial?.tags ?? []).filter((tag): tag is ProblemTagSlug =>
      PROBLEM_TAG_OPTIONS.some((option) => option.slug === tag),
    ),
  )
  const [sampleTests, setSampleTests] = useState<TestCaseInput[]>(
    initial?.testCases?.filter((t) => t.isSample) ?? [emptyTest(true)],
  )
  const [hiddenTests, setHiddenTests] = useState<TestCaseInput[]>(
    initial?.testCases?.filter((t) => !t.isSample) ?? [emptyTest(false)],
  )
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (slug: ProblemTagSlug) => {
    setTags((prev) => {
      if (prev.includes(slug)) return prev.filter((tag) => tag !== slug)
      if (prev.length >= MAX_TAGS) {
        toast.error(`Pick at most ${MAX_TAGS} tags`)
        return prev
      }
      return [...prev, slug]
    })
  }

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
    if (tags.length === 0) {
      toast.error("Select at least one tag")
      return
    }
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
        tags,
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
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tags</p>
          <p className="text-xs text-muted">{tags.length}/{MAX_TAGS} selected</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROBLEM_TAG_OPTIONS.map((option) => {
            const selected = tags.includes(option.slug)
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => toggleTag(option.slug)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? "border-highlight/60 bg-highlight/15 text-highlight"
                    : "border-border bg-secondary/20 text-muted hover:border-midtone hover:text-accent"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
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
        <Button
          type="submit"
          variant="primary"
          className="sm:flex-1"
          disabled={submitting || !title.trim() || !statement.trim() || tags.length === 0}
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default ProblemForm
