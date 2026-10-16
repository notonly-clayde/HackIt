import { useState } from "react"
import { FaWandMagicSparkles } from "react-icons/fa6"
import Button from "../ui/Button"
import Field, { SelectField, TextAreaField } from "../ui/Field"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "../../contexts/ToastContext"
import { PROBLEM_TAG_OPTIONS, type ProblemTagSlug } from "../../lib/problemTags"
import ProblemService from "../../services/ProblemService"
import StatementMarkdownEditor from "./StatementMarkdownEditor"
import ProblemAiGenerateModal from "./ProblemAiGenerateModal"
import {
  formatArgLines,
  isArgListInput,
  normalizeTestInput,
  normalizeTestValue,
  type TestInputMode,
} from "../play/runner/parseTestValue"
import type {
  CreateProblemInput,
  GeneratedProblemDraft,
  ProblemDifficulty,
  TestCaseInput,
} from "../../types/api"

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
  const { token } = useAuth()
  const toast = useToast()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [statement, setStatement] = useState(initial?.statement ?? "")
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>(initial?.difficulty ?? "medium")
  const [timeLimitMs, setTimeLimitMs] = useState(String(initial?.timeLimitMs ?? 2000))
  const [memoryLimitMb, setMemoryLimitMb] = useState(String(initial?.memoryLimitMb ?? 256))
  const [starterPython, setStarterPython] = useState(initial?.starterPython ?? "")
  const [starterJs, setStarterJs] = useState(initial?.starterJs ?? "")
  const [tags, setTags] = useState<ProblemTagSlug[]>(
    (initial?.tags ?? []).filter((tag): tag is ProblemTagSlug =>
      PROBLEM_TAG_OPTIONS.some((option) => option.slug === tag),
    ),
  )
  const [inputMode, setInputMode] = useState<TestInputMode>(() =>
    !initial?.testCases || initial.testCases.some((t) => isArgListInput(t.input)) ? "lines" : "json",
  )
  const initialTests = (initial?.testCases ?? []).map((test) =>
    inputMode === "lines" ? { ...test, input: formatArgLines(test.input) } : test,
  )
  const [sampleTests, setSampleTests] = useState<TestCaseInput[]>(() =>
    initial?.testCases ? initialTests.filter((t) => t.isSample) : [emptyTest(true)],
  )
  const [hiddenTests, setHiddenTests] = useState<TestCaseInput[]>(() =>
    initial?.testCases ? initialTests.filter((t) => !t.isSample) : [emptyTest(false)],
  )
  const [submitting, setSubmitting] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const formHasDraftContent = () => {
    if (title.trim() || statement.trim() || starterPython.trim() || starterJs.trim() || tags.length > 0) {
      return true
    }
    const tests = [...sampleTests, ...hiddenTests]
    return tests.some((t) => t.input.trim() || t.expectedOutput.trim())
  }

  const applyGeneratedDraft = (draft: GeneratedProblemDraft) => {
    const mode = inputMode
    const formatTestInput = (input: string) => (mode === "lines" ? formatArgLines(input) : input)

    setTitle(draft.title)
    setStatement(draft.statement)
    setDifficulty(draft.difficulty)
    setTimeLimitMs(String(draft.timeLimitMs))
    setMemoryLimitMb(String(draft.memoryLimitMb))
    setStarterPython(draft.starterPython ?? "")
    setStarterJs(draft.starterJs ?? "")
    setTags(
      draft.tags.filter((tag): tag is ProblemTagSlug =>
        PROBLEM_TAG_OPTIONS.some((option) => option.slug === tag),
      ),
    )

    const samples = draft.testCases
      .filter((t) => t.isSample)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((t) => ({
        ...t,
        input: formatTestInput(t.input),
        expectedOutput: t.expectedOutput,
      }))
    const hidden = draft.testCases
      .filter((t) => !t.isSample)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((t) => ({
        ...t,
        input: formatTestInput(t.input),
        expectedOutput: t.expectedOutput,
      }))

    setSampleTests(samples.length > 0 ? samples : [emptyTest(true)])
    setHiddenTests(hidden.length > 0 ? hidden : [emptyTest(false)])
  }

  const handleAiGenerate = async (payload: { prompt: string; difficulty?: ProblemDifficulty }) => {
    setAiGenerating(true)
    const [draft, err] = await ProblemService.generateDraft(token, {
      ...payload,
      inputMode,
    })
    setAiGenerating(false)

    if (err || !draft) {
      toast.error(err ?? "Failed to generate problem draft")
      return
    }

    if (formHasDraftContent()) {
      const ok = window.confirm("Replace your current draft with the AI-generated problem?")
      if (!ok) return
    }

    applyGeneratedDraft(draft)
    setAiModalOpen(false)
    toast.success("AI draft applied — review tests before saving")
  }

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

    const normalizeCase = (test: TestCaseInput, isSample: boolean, order: number): TestCaseInput => {
      const caseLabel = `${isSample ? "Sample" : "Hidden"} case ${order + 1}`
      let input: string
      let expectedOutput: string
      try {
        input = normalizeTestInput(test.input, inputMode)
      } catch (err) {
        throw new Error(`${caseLabel} input: ${err instanceof Error ? err.message : String(err)}`, { cause: err })
      }
      try {
        expectedOutput = normalizeTestValue(test.expectedOutput)
      } catch (err) {
        throw new Error(`${caseLabel} expected output: ${err instanceof Error ? err.message : String(err)}`, {
          cause: err,
        })
      }
      return { input, expectedOutput, isSample, order }
    }

    let testCases: TestCaseInput[]
    try {
      testCases = [
        ...sampleTests.map((test, index) => normalizeCase(test, true, index)),
        ...hiddenTests.map((test, index) => normalizeCase(test, false, index)),
      ]
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid test case")
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        statement: statement.trim(),
        difficulty,
        timeLimitMs: Number(timeLimitMs),
        memoryLimitMb: Number(memoryLimitMb),
        starterPython: starterPython.trim() || null,
        starterJs: starterJs.trim() || null,
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
            label={inputMode === "lines" ? "Input (one argument per line)" : "Input"}
            value={test.input}
            onChange={(e) => updateTest(tests, setTests, index, "input", e.target.value)}
            placeholder={inputMode === "lines" ? '[2,7,11,15]\n9' : '{"nums": [2,7,11,15], "target": 9}'}
            rows={2}
          />
          <TextAreaField
            label="Expected output"
            value={test.expectedOutput}
            placeholder="[0,1]"
            onChange={(e) => updateTest(tests, setTests, index, "expectedOutput", e.target.value)}
            rows={2}
          />
        </div>
      ))}
    </div>
  )

  return (
    <form className="flex flex-col gap-5 lg:gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Problem details</p>
        <Button
          type="button"
          variant="ghost"
          className="!py-1.5 !px-3 text-xs gap-1.5 border border-border hover:border-highlight/40"
          onClick={() => setAiModalOpen(true)}
        >
          <FaWandMagicSparkles className="text-highlight" aria-hidden />
          Generate with AI
        </Button>
      </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <TextAreaField
          label="Python starter (optional)"
          value={starterPython}
          onChange={(e) => setStarterPython(e.target.value)}
          placeholder={"def solve(nums, target):\n    pass"}
          rows={3}
        />
        <TextAreaField
          label="JavaScript starter (optional)"
          value={starterJs}
          onChange={(e) => setStarterJs(e.target.value)}
          placeholder={"function solve(nums, target) {\n}"}
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-2">
        <SelectField
          label="Test input format"
          value={inputMode}
          onChange={(e) => setInputMode(e.target.value as TestInputMode)}
        >
          <option value="lines">Lines (one argument per line, like LeetCode)</option>
          <option value="json">JSON (single value passed as solve(input))</option>
        </SelectField>
        <p className="text-xs text-muted">
          {inputMode === "lines"
            ? "Each line is one argument to solve, in order. Example: solve(nums, target) takes [2,7,11,15] on line 1 and 9 on line 2."
            : "The whole input is one value passed to solve(input), e.g. an object with named fields."}{" "}
          Values are typed: 42 is a number, [1,2] an array, {"{a: 1}"} an object, "text" or 'text' a string without
          quotes, and plain text a string.
        </p>
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
      <ProblemAiGenerateModal
        open={aiModalOpen}
        inputMode={inputMode}
        busy={aiGenerating}
        onClose={() => setAiModalOpen(false)}
        onGenerate={handleAiGenerate}
      />
    </form>
  )
}

export default ProblemForm
