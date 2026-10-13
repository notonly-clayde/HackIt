import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import Editor from "@monaco-editor/react"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
import Select from "../ui/Select"
import { HiOutlinePlay, HiOutlinePaperAirplane } from "react-icons/hi2"
import TournamentTimer from "../tournament/TournamentTimer"
import ContestFreezeOverlay from "../tournament/ContestFreezeOverlay"
import PlayWorkspaceLayout from "./PlayWorkspaceLayout"
import ProblemStatement from "../problems/ProblemStatement"
import ProblemTagChips from "../problems/ProblemTagChips"
import PlayLeftPanelTabs, { type PlayLeftTab } from "./PlayLeftPanelTabs"
import RunResultsPanel from "./RunResultsPanel"
import SubmissionsPanel from "./SubmissionsPanel"
import { buildTestHarness, testHarnessKey, type PlayLanguage } from "./buildTestHarness"
import { runTestsInBrowserWorker } from "./runner/runInBrowserWorker"
import {
  createErrorResult,
  createRunningResult,
  normalizeBrowserRunResult,
  normalizeSubmissionResult,
  type PlayRunResultView,
} from "./runner/normalizeRunResult"
import ProblemService from "../../services/ProblemService"
import TournamentService from "../../services/TournamentService"
import VersusService from "../../services/VersusService"
import { useHudSound } from "../../contexts/SoundContext"
import { useToast } from "../../contexts/ToastContext"
import { useContestFreezeSounds } from "../../hooks/useContestFreezeSounds"
import { useTournamentUrgencySound } from "../../hooks/useTournamentUrgencySound"
import { useLiveFocusIntegrity, type FocusIntegrityTarget } from "../../hooks/useLiveFocusIntegrity"
import type {
  ProblemDetail,
  TournamentTimerFields,
  VersusMatchEnded,
  VersusSubmissionResult,
} from "../../types/api"

function playResultCue(result: PlayRunResultView, play: (cue: "confirm" | "deny") => void) {
  if (result.status === "accepted" || (result.passed > 0 && result.failed === 0)) {
    play("confirm")
  } else {
    play("deny")
  }
}

const defaultStarters: Record<PlayLanguage, string> = {
  python: "# Write your solution\n",
  javascript: "// Write your solution\n",
  cpp: "// Write your solution\n",
}

function solutionKey(problemId: string, lang: PlayLanguage): string {
  return `${problemId}:${lang}`
}

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  scrollBeyondLastLine: false,
  padding: { top: 12 },
  automaticLayout: true,
}

type PlayArenaProps = {
  backTo: string
  backLabel?: string
  modeLabel?: string
  title?: string
  problems?: ProblemDetail[]
  readOnly?: boolean
  initialCode?: string
  showModBar?: boolean
  spectatePlayers?: string[]
  onSelectPlayer?: (name: string) => void
  selectedPlayer?: string
  playerCodeMap?: Record<string, string>
  onLeave?: () => void
  timerFields?: TournamentTimerFields
  contestFrozen?: boolean
  contestTimeExpired?: boolean
  resumeCountdownSeconds?: number | null
  hostControls?: {
    isPaused: boolean
    isResuming?: boolean
    onPauseToggle: () => void
    onEnd: () => void
    acting?: boolean
  }
  authToken?: string | null
  tournamentId?: string
  matchId?: string
  onMatchEnded?: (event: VersusMatchEnded) => void
  matchActions?: ReactNode
  focusIntegrity?: { enabled: boolean; paused?: boolean }
}

const PlayArena = ({
  backTo,
  backLabel = "Leave",
  modeLabel = "Contest",
  title,
  problems = [],
  readOnly = false,
  initialCode,
  showModBar = false,
  spectatePlayers,
  onSelectPlayer,
  selectedPlayer,
  playerCodeMap,
  timerFields,
  contestFrozen = false,
  contestTimeExpired = false,
  resumeCountdownSeconds = null,
  hostControls,
  authToken = null,
  tournamentId,
  matchId,
  onMatchEnded,
  onLeave,
  matchActions,
  focusIntegrity,
}: PlayArenaProps) => {
  const { play } = useHudSound()
  const toast = useToast()
  const focusTarget: FocusIntegrityTarget | null = tournamentId
    ? { mode: "tournament", tournamentId }
    : matchId
      ? { mode: "versus", matchId }
      : null
  const { monitoring: focusMonitoring, totalDeduction: focusDeduction } = useLiveFocusIntegrity({
    token: authToken,
    target: focusTarget,
    enabled: Boolean(focusIntegrity?.enabled && !readOnly),
    paused: focusIntegrity?.paused,
  })
  const focusUnit = focusTarget?.mode === "versus" ? "ELO" : "points"
  useTournamentUrgencySound(timerFields, !readOnly)
  useContestFreezeSounds(contestFrozen, resumeCountdownSeconds, !readOnly)
  const [activeIndex, setActiveIndex] = useState(0)
  const [language, setLanguage] = useState<PlayLanguage>("python")
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({})
  const [testCodeByProblem, setTestCodeByProblem] = useState<Record<string, string>>({})
  const [runResult, setRunResult] = useState<PlayRunResultView | null>(null)
  const [submissionHistoryByProblem, setSubmissionHistoryByProblem] = useState<
    Record<string, PlayRunResultView[]>
  >({})
  const [leftTab, setLeftTab] = useState<PlayLeftTab>("problem")
  const [outputUnread, setOutputUnread] = useState(false)
  const [submissionsUnread, setSubmissionsUnread] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const solutionEditorRef = useRef<{ layout: () => void } | null>(null)
  const testEditorRef = useRef<{ layout: () => void } | null>(null)
  const workspaceLoadedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevProblemIdRef = useRef<string | null>(null)

  const activeProblem = problems[activeIndex] ?? null

  const submissionHistory = activeProblem
    ? submissionHistoryByProblem[activeProblem.id] ?? []
    : []

  const starterFor = (problem: ProblemDetail | null, lang: PlayLanguage) => {
    if (!problem) return defaultStarters[lang]
    if (lang === "python" && problem.starterPython) return problem.starterPython
    if (lang === "javascript" && problem.starterJs) return problem.starterJs
    if (lang === "cpp" && problem.starterCpp) return problem.starterCpp
    return defaultStarters[lang]
  }

  const persistWorkspace = useCallback(
    (patch: {
      problemId?: string
      sourceCode?: string
      activeProblemId?: string | null
      language?: PlayLanguage
    }) => {
      if (!tournamentId || !authToken || readOnly) return

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(() => {
        void TournamentService.saveMyWorkspace(authToken, tournamentId, patch)
      }, 800)
    },
    [authToken, readOnly, tournamentId],
  )

  useEffect(() => {
    if (!tournamentId || !authToken || readOnly || problems.length === 0 || workspaceLoadedRef.current) {
      return
    }

    let cancelled = false

    void TournamentService.getMyWorkspace(authToken, tournamentId).then(([workspace]) => {
      if (cancelled || !workspace) return

      workspaceLoadedRef.current = true

      const nextCode: Record<string, string> = {}
      for (const problem of problems) {
        const saved = workspace.entries.find((entry) => entry.problemId === problem.id)
        if (saved) {
          nextCode[solutionKey(problem.id, workspace.session.language)] = saved.sourceCode
        }
      }

      setCodeByProblem((prev) => ({ ...prev, ...nextCode }))
      setLanguage(workspace.session.language)

      if (workspace.session.activeProblemId) {
        const index = problems.findIndex((problem) => problem.id === workspace.session.activeProblemId)
        if (index >= 0) {
          setActiveIndex(index)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [authToken, problems, readOnly, tournamentId])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!workspaceLoadedRef.current || !activeProblem || !tournamentId || readOnly) return
    persistWorkspace({ activeProblemId: activeProblem.id, language })
  }, [activeIndex, activeProblem, language, persistWorkspace, readOnly, tournamentId])

  useEffect(() => {
    if (!activeProblem) return
    const key = solutionKey(activeProblem.id, language)
    setCodeByProblem((prev) => {
      if (prev[key]) return prev
      return { ...prev, [key]: starterFor(activeProblem, language) }
    })
  }, [activeProblem, language])

  useEffect(() => {
    if (!activeProblem) return
    const key = testHarnessKey(activeProblem.id, language)
    setTestCodeByProblem((prev) => {
      if (prev[key]) return prev
      return {
        ...prev,
        [key]: buildTestHarness(language, activeProblem.sampleTests, starterFor(activeProblem, language)),
      }
    })
  }, [activeProblem, language])

  useEffect(() => {
    if (!activeProblem) return
    if (prevProblemIdRef.current === activeProblem.id) return
    prevProblemIdRef.current = activeProblem.id
    setRunResult(null)
  }, [activeProblem])

  useEffect(() => {
    if (runResult && runResult.status !== "running" && leftTab !== "output") {
      setOutputUnread(true)
    }
  }, [runResult, leftTab])

  const code = activeProblem
    ? codeByProblem[solutionKey(activeProblem.id, language)] ?? starterFor(activeProblem, language)
    : initialCode ?? defaultStarters.python

  const testCode = activeProblem
    ? testCodeByProblem[testHarnessKey(activeProblem.id, language)] ??
      buildTestHarness(language, activeProblem.sampleTests, starterFor(activeProblem, language))
    : buildTestHarness(language, [], null)

  const displayCode = useMemo(() => {
    if (readOnly && selectedPlayer && playerCodeMap?.[selectedPlayer] != null) {
      return playerCodeMap[selectedPlayer]
    }
    return code
  }, [readOnly, selectedPlayer, playerCodeMap, code])

  const displayTitle = activeProblem?.title ?? title ?? (problems.length === 0 ? "No problem assigned" : undefined)

  const unavailable = (action: string) => {
    toast.info(`${action} is not available yet`)
  }

  const handleLeftTabChange = (tab: PlayLeftTab) => {
    if (tab !== leftTab) play("toggle")
    setLeftTab(tab)
    if (tab === "output") setOutputUnread(false)
    if (tab === "submissions") setSubmissionsUnread(false)
  }

  const handleProblemSelect = (index: number) => {
    if (index !== activeIndex) play("toggle")
    setActiveIndex(index)
  }

  const handleLanguageChange = (lang: PlayLanguage) => {
    if (!activeProblem) {
      setLanguage(lang)
      return
    }

    const key = solutionKey(activeProblem.id, lang)
    setLanguage(lang)
    setCodeByProblem((prev) => {
      const source = prev[key] ?? starterFor(activeProblem, lang)
      persistWorkspace({
        problemId: activeProblem.id,
        sourceCode: source,
        activeProblemId: activeProblem.id,
        language: lang,
      })
      if (prev[key]) return prev
      return { ...prev, [key]: source }
    })
  }

  const refreshEditorLayout = useCallback(() => {
    solutionEditorRef.current?.layout()
    testEditorRef.current?.layout()
  }, [])

  const handleRun = async () => {
    if (!activeProblem || controlsDisabled) return

    play("scan")
    setIsRunning(true)
    setRunResult(createRunningResult("run"))
    setLeftTab("output")
    setOutputUnread(false)

    try {
      if (language === "javascript") {
        const result = await runTestsInBrowserWorker(code, testCode, activeProblem.timeLimitMs)
        const normalized = normalizeBrowserRunResult(result)
        setRunResult(normalized)
        playResultCue(normalized, play)
      } else {
        if (!authToken) {
          const failed = createErrorResult("run", "Sign in to run sample tests for this language.")
          setRunResult(failed)
          play("deny")
          return
        }

        const body = { language, sourceCode: code }
        const [result, err] = matchId
          ? await VersusService.runSolution(authToken, matchId, body)
          : tournamentId
            ? await TournamentService.runSolution(authToken, tournamentId, activeProblem.id, body)
            : await ProblemService.runSolution(authToken, activeProblem.id, body)

        if (err || !result) {
          const failed = createErrorResult("run", err ?? "Run failed")
          setRunResult(failed)
          play("deny")
          return
        }

        const normalized = normalizeSubmissionResult(result, "run")
        setRunResult(normalized)
        playResultCue(normalized, play)
      }
    } catch (error) {
      const failed = createErrorResult("run", error instanceof Error ? error.message : "Run failed")
      setRunResult(failed)
      play("deny")
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!activeProblem || controlsDisabled) return

    if (!authToken) {
      toast.error("Sign in to submit")
      return
    }

    play("transmit")
    setIsSubmitting(true)

    const body = { language, sourceCode: code }
    const [result, err] = matchId
      ? await VersusService.submitSolution(authToken, matchId, body)
      : tournamentId
        ? await TournamentService.submitSolution(authToken, tournamentId, activeProblem.id, body)
        : await ProblemService.submitSolution(authToken, activeProblem.id, body)

    setIsSubmitting(false)

    if (err || !result) {
      const failed = createErrorResult("submit", err ?? "Submit failed")
      setSubmissionHistoryByProblem((prev) => ({
        ...prev,
        [activeProblem.id]: [failed, ...(prev[activeProblem.id] ?? [])],
      }))
      setLeftTab("submissions")
      setSubmissionsUnread(false)
      play("deny")
      return
    }

    const normalized = normalizeSubmissionResult(result, "submit")
    setSubmissionHistoryByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: [normalized, ...(prev[activeProblem.id] ?? [])],
    }))
    setLeftTab("submissions")
    setSubmissionsUnread(false)
    playResultCue(normalized, play)

    if (matchId) {
      const matchEnded = (result as VersusSubmissionResult).matchEnded
      if (matchEnded) onMatchEnded?.(matchEnded)
    }
  }

  const isResuming = contestFrozen && resumeCountdownSeconds != null
  const editorReadOnly = readOnly || !activeProblem || contestFrozen || contestTimeExpired
  const controlsDisabled = contestFrozen || contestTimeExpired
  const monacoLanguage = language === "cpp" ? "cpp" : language

  const problemTabContent = (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-accent mb-2">
        {contestFrozen ? "Contest paused" : (displayTitle ?? "No problem assigned")}
      </h1>
      {!contestFrozen && activeProblem ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge tone="neutral">{activeProblem.difficulty}</Badge>
            <Badge tone="neutral">{activeProblem.timeLimitMs} ms</Badge>
            <Badge tone="neutral">{activeProblem.memoryLimitMb} MB</Badge>
          </div>
          <ProblemTagChips tags={activeProblem.tags} className="mb-3" />
          <ProblemStatement content={activeProblem.statement} />
        </>
      ) : !contestFrozen ? (
        <p className="text-sm text-muted leading-relaxed">
          Problems will appear here once the tournament is Live or a problem is assigned.
        </p>
      ) : (
        <p className="text-sm text-muted leading-relaxed">
          Problem details are hidden while the contest is paused.
        </p>
      )}
    </div>
  )

  const problemPanel = (
    <PlayLeftPanelTabs
      activeTab={leftTab}
      onTabChange={handleLeftTabChange}
      outputUnread={outputUnread}
      submissionsUnread={submissionsUnread}
      problemContent={problemTabContent}
      outputContent={<RunResultsPanel result={runResult} />}
      submissionsContent={<SubmissionsPanel submissions={submissionHistory} />}
    />
  )

  const solutionPanel = (
    <>
      {spectatePlayers && spectatePlayers.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border px-3 py-2">
          {spectatePlayers.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelectPlayer?.(name)}
              className={`ui-chip shrink-0 text-xs ${
                selectedPlayer === name
                  ? "bg-highlight/20 text-highlight border border-highlight/40"
                  : "border border-border text-muted hover:text-accent"
              }`}
            >
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Solution</p>
        <p className="text-xs text-muted capitalize">{language}</p>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={displayCode}
          onMount={(editor) => {
            solutionEditorRef.current = editor
          }}
          onChange={(v) => {
            if (!editorReadOnly && activeProblem) {
              const next = v ?? ""
              const key = solutionKey(activeProblem.id, language)
              setCodeByProblem((prev) => ({ ...prev, [key]: next }))
              persistWorkspace({
                problemId: activeProblem.id,
                sourceCode: next,
                activeProblemId: activeProblem.id,
                language,
              })
            }
          }}
          options={{
            ...editorOptions,
            readOnly: editorReadOnly,
          }}
        />
      </div>
    </>
  )

  const testPanel = (
    <>
      <div className="shrink-0 border-b border-border px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Test cases</p>
        <p className="text-xs text-muted mt-0.5">
          {language === "javascript"
            ? "Vitest-style sample tests (Run executes in browser)"
            : "Native sample tests (Run executes on server)"}
          {" · "}
          Inputs like [1,2,3] are auto-parsed as JSON when valid.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={testCode}
          onMount={(editor) => {
            testEditorRef.current = editor
          }}
          onChange={(v) => {
            if (!editorReadOnly && activeProblem) {
              const key = testHarnessKey(activeProblem.id, language)
              setTestCodeByProblem((prev) => ({ ...prev, [key]: v ?? "" }))
            }
          }}
          options={{
            ...editorOptions,
            readOnly: editorReadOnly,
          }}
        />
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="shrink-0 border-b border-border bg-surface-raised/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {onLeave ? (
              <button
                type="button"
                onClick={onLeave}
                className="text-sm text-muted hover:text-highlight shrink-0"
              >
                ← {backLabel}
              </button>
            ) : (
              <Link to={backTo} className="text-sm text-muted hover:text-highlight shrink-0">
                ← {backLabel}
              </Link>
            )}
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="min-w-0 border-l-2 border-highlight/40 pl-3">
              <p className="ui-kicker !text-[0.65rem] mb-0.5">{modeLabel}</p>
              <p className="text-sm font-semibold text-accent truncate">{displayTitle ?? "No problem assigned"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {timerFields && <TournamentTimer fields={timerFields} size="sm" />}
            {matchActions}
            {!readOnly && activeProblem && (
              <>
                <Select
                  size="sm"
                  value={language}
                  disabled={controlsDisabled}
                  className="w-[9.75rem]"
                  aria-label="Language"
                  options={[
                    { value: "python", label: "Python" },
                    { value: "javascript", label: "JavaScript" },
                    { value: "cpp", label: "C++" },
                  ]}
                  onChange={(next) => handleLanguageChange(next as PlayLanguage)}
                />
                <Button
                  variant="secondary"
                  className="!py-1.5 !px-3 text-sm"
                  disabled={controlsDisabled || isRunning || isSubmitting}
                  sound={false}
                  onClick={() => void handleRun()}
                >
                  {isRunning ? "Running…" : (
                    <>
                      <HiOutlinePlay className="h-4 w-4" />
                      Run
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  className="!py-1.5 !px-3 text-sm"
                  disabled={controlsDisabled || isRunning || isSubmitting}
                  sound={false}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? "Submitting…" : (
                    <>
                      <HiOutlinePaperAirplane className="h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {focusMonitoring && (
          <div className="flex flex-wrap items-center gap-2 px-3 sm:px-5 py-1.5 border-t border-border bg-primary/40 text-xs">
            <Badge tone="warn">Focus mode</Badge>
            <span className="text-muted">
              Stay on this tab. Alt-tabbing or switching tabs costs {focusUnit} and alerts the{" "}
              {focusTarget?.mode === "versus" ? "opponent" : "host and moderators"}.
            </span>
            {focusDeduction > 0 && (
              <span className="text-danger font-semibold tabular-nums">
                −{focusDeduction} {focusUnit} so far
              </span>
            )}
          </div>
        )}

        {problems.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-3 sm:px-5 py-2 border-t border-border">
            {problems.map((problem, index) => (
              <button
                key={problem.id}
                type="button"
                onClick={() => handleProblemSelect(index)}
                disabled={controlsDisabled}
                className={`ui-chip shrink-0 text-xs disabled:opacity-50 ${
                  activeIndex === index
                    ? "bg-highlight/20 text-highlight border border-highlight/40"
                    : "border border-border text-muted hover:text-accent"
                }`}
              >
                <span>{index + 1}. {problem.title}</span>
              </button>
            ))}
          </div>
        )}

        {hostControls && (
          <div className="flex flex-wrap items-center gap-2 px-3 sm:px-5 py-2 border-t border-border bg-primary/40">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">Host</span>
            <Button
              variant={hostControls.isPaused ? "primary" : "secondary"}
              className="!py-1 !px-3 text-xs"
              onClick={hostControls.onPauseToggle}
              disabled={hostControls.acting}
            >
              {hostControls.isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              variant="danger"
              className="!py-1 !px-3 text-xs"
              onClick={hostControls.onEnd}
              disabled={hostControls.acting}
            >
              Stop
            </Button>
            {hostControls.isPaused && !hostControls.isResuming && <Badge tone="warn">Paused</Badge>}
            {hostControls.isResuming && <Badge tone="warn">Resuming…</Badge>}
          </div>
        )}

        {showModBar && !hostControls && (
          <div className="flex flex-wrap items-center gap-2 px-3 sm:px-5 py-2 border-t border-border bg-primary/40">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">Mod</span>
            <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => unavailable("Warn")}>
              Warn player
            </Button>
            <Button variant="danger" className="!py-1 !px-3 text-xs" onClick={() => unavailable("Disqualify")}>
              Disqualify
            </Button>
            {contestFrozen && !isResuming && <Badge tone="warn">Paused</Badge>}
            {isResuming && <Badge tone="warn">Resuming…</Badge>}
          </div>
        )}
      </header>

      <div className="relative flex-1 min-h-0">
        <PlayWorkspaceLayout
          problemPanel={problemPanel}
          solutionPanel={solutionPanel}
          testPanel={testPanel}
          onLayoutChange={refreshEditorLayout}
        />

        {contestFrozen && (
          <ContestFreezeOverlay
            isResuming={isResuming}
            secondsLeft={resumeCountdownSeconds}
          />
        )}
      </div>
    </div>
  )
}

export default PlayArena
