import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HiOutlineBolt, HiOutlineKey, HiOutlinePlus, HiOutlineUserPlus } from "react-icons/hi2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import Field from "../components/ui/Field"
import Badge from "../components/ui/Badge"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import {
  cancelVersusQueue,
  queueVersus,
  subscribeVersusError,
  subscribeVersusMatchFound,
} from "../services/socket"
import type { VersusDifficulty } from "../types/api"

const DIFFICULTIES: {
  id: VersusDifficulty
  label: string
  duration: string
  elo: string
}[] = [
  { id: "easy", label: "Easy", duration: "15 min", elo: "Low ELO stake" },
  { id: "medium", label: "Medium", duration: "30 min", elo: "Medium ELO stake" },
  { id: "hard", label: "Hard", duration: "45 min", elo: "Highest ELO stake" },
]

const Versus = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<VersusDifficulty | null>(null)
  const [searching, setSearching] = useState(false)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const searchingRef = useRef(false)

  const showSoon = (label: string) => {
    setNotice(`${label} is not available yet`)
    setTimeout(() => setNotice(null), 2200)
  }

  useEffect(() => {
    searchingRef.current = searching
  }, [searching])

  useEffect(() => {
    if (!searching) {
      setElapsedSec(0)
      return
    }
    const started = Date.now()
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000))
    }, 250)
    return () => window.clearInterval(id)
  }, [searching])

  useEffect(() => {
    if (!token || !searching) return

    const unsubFound = subscribeVersusMatchFound(token, (match) => {
      setSearching(false)
      navigate(`/versus/lobby/${match.id}`)
    })
    const unsubError = subscribeVersusError(token, (payload) => {
      setQueueError(payload.error)
      setSearching(false)
      toast.error(payload.error)
    })

    return () => {
      unsubFound()
      unsubError()
    }
  }, [token, searching, navigate, toast])

  useEffect(() => {
    return () => {
      if (searchingRef.current && token) {
        void cancelVersusQueue(token)
      }
    }
  }, [token])

  const startSearch = async () => {
    if (!token || !difficulty) return
    setQueueError(null)
    setSearching(true)
    const ack = await queueVersus(token, difficulty)
    if (!ack.ok) {
      setSearching(false)
      setQueueError(ack.error)
      toast.error(ack.error)
    }
  }

  const cancelSearch = async () => {
    if (token) await cancelVersusQueue(token)
    setSearching(false)
    setQueueError(null)
  }

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <>
      <div className="page-container mt-10 sm:mt-14 text-center px-2">
        <p className="ui-kicker mb-3 justify-center">1v1 arena</p>
        <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-accent tracking-tight">
          Versus Battle
        </h1>
        <p className="text-muted text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
          Pick a difficulty, then queue for a ranked opponent in the same pool. Hard swings ELO more
          than Easy.
        </p>
      </div>

      <div className="page-container grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mt-10 sm:mt-12">
        <Card hover className="p-6 sm:p-8 text-left flex flex-col">
          <div className="ui-icon-box mb-4 !h-12 !w-12">
            <HiOutlineBolt className="h-6 w-6" />
          </div>
          <h2 className="text-accent font-bold text-xl mb-2 tracking-tight">Find a match</h2>
          <p className="text-muted text-sm leading-relaxed mb-4">
            Choose difficulty first. You only match players who picked the same one.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIFFICULTIES.map((option) => {
              const selected = difficulty === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={searching}
                  onClick={() => setDifficulty(option.id)}
                  className={`rounded-xl border px-2 py-3 text-center transition ${
                    selected
                      ? "border-highlight bg-highlight/15 text-accent"
                      : "border-border bg-primary/40 text-muted hover:border-highlight/40"
                  } disabled:opacity-60`}
                >
                  <div className="font-semibold text-sm text-accent">{option.label}</div>
                  <div className="text-[11px] mt-1 opacity-80">{option.duration}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{option.elo}</div>
                </button>
              )
            })}
          </div>

          {searching ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-border bg-primary/40 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-accent font-medium">
                    Searching
                    {difficulty ? (
                      <Badge tone="neutral" className="ml-2 capitalize">
                        {difficulty}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="font-mono text-highlight tabular-nums">
                    {formatElapsed(elapsedSec)}
                  </span>
                </div>
                <p className="text-muted text-xs mt-1">Pairing nearby ELO in your difficulty pool…</p>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => void cancelSearch()}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              disabled={!difficulty || !token}
              onClick={() => void startSearch()}
            >
              <HiOutlineUserPlus className="h-4 w-4" />
              Find match
            </Button>
          )}

          {queueError && !searching ? (
            <p className="text-danger text-xs mt-3">{queueError}</p>
          ) : null}
        </Card>

        <Card hover className="p-6 sm:p-8 text-left flex flex-col">
          <div className="ui-icon-box mb-4 !h-12 !w-12">
            <HiOutlineKey className="h-6 w-6" />
          </div>
          <h2 className="text-accent font-bold text-xl mb-2 tracking-tight">Private room</h2>
          <p className="text-muted text-sm leading-relaxed flex-1 mb-6">
            Create a lobby for a friend, or join with a room code.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="primary" className="flex-1" onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="h-4 w-4" />
              Create
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setJoinOpen(true)}>
              <HiOutlineKey className="h-4 w-4" />
              Join
            </Button>
          </div>
        </Card>
      </div>

      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ui-card px-4 py-2.5 text-sm text-accent shadow-xl">
          {notice}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create lobby"
        description="Set up your game and invite a friend."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setCreateOpen(false)
                showSoon("Private rooms")
              }}
            >
              Create room
            </Button>
          </>
        }
      >
        <Field label="Lobby name" placeholder="HackIT Room" defaultValue="HackIT Room" />
        <Field label="Password (optional)" type="password" placeholder="Leave blank for open" />
        <Field label="Maximum players" type="number" min={2} max={2} defaultValue={2} />
      </Modal>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join lobby"
        description="Enter the room code shared by the host."
        footer={
          <>
            <Button variant="secondary" onClick={() => setJoinOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setJoinOpen(false)
                showSoon("Private rooms")
              }}
            >
              Join room
            </Button>
          </>
        }
      >
        <Field label="Lobby ID" placeholder="Room ID" />
        <Field label="Password" type="password" placeholder="If required" />
      </Modal>
    </>
  )
}

export default Versus
