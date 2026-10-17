import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { HiOutlineBolt, HiOutlineKey, HiOutlinePlus, HiOutlineUserPlus } from "react-icons/hi2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import Field from "../components/ui/Field"
import Badge from "../components/ui/Badge"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import VersusService from "../services/VersusService"
import {
  cancelVersusQueue,
  queueVersus,
  subscribeVersusError,
  subscribeVersusMatchFound,
} from "../services/socket"
import { queryKeys } from "../lib/queryKeys"
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
  const [searchParams] = useSearchParams()
  const { token, profile } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [difficulty, setDifficulty] = useState<VersusDifficulty | null>(null)
  const [searching, setSearching] = useState(false)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const searchingRef = useRef(false)
  const autoQueuedRef = useRef(false)
  const [roomName, setRoomName] = useState("HackIT Room")
  const [roomPassword, setRoomPassword] = useState("")
  const [roomDifficulty, setRoomDifficulty] = useState<VersusDifficulty>("easy")
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState("")
  const [joinPassword, setJoinPassword] = useState("")
  const [joiningRoom, setJoiningRoom] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleCreateRoom = async () => {
    if (!token || creatingRoom) return
    setCreatingRoom(true)
    const [room, err] = await VersusService.createRoom(token, {
      difficulty: roomDifficulty,
      lobbyName: roomName.trim() || undefined,
      password: roomPassword || undefined,
    })
    setCreatingRoom(false)
    if (err || !room) {
      toast.error(err ?? "Failed to create room")
      return
    }
    setCreateOpen(false)
    const userId = profile?.id
    if (userId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.hosted(userId) })
    }
    navigate(`/versus/lobby/${room.id}`)
  }

  const handleJoinRoom = async () => {
    // Accept a pasted lobby link as well as a bare room ID.
    const roomId = joinRoomId.trim().replace(/\/+$/, "").split("/").pop() ?? ""
    if (!token || !roomId || joiningRoom) return
    setJoiningRoom(true)
    setJoinError(null)
    const [room, err] = await VersusService.joinRoom(token, roomId, joinPassword)
    setJoiningRoom(false)
    if (err || !room) {
      setJoinError(err ?? "Failed to join room")
      return
    }
    setJoinOpen(false)
    navigate(`/versus/lobby/${room.id}`)
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

  const startSearch = async (picked?: VersusDifficulty) => {
    const pool = picked ?? difficulty
    if (!token || !pool) return
    setDifficulty(pool)
    setQueueError(null)
    setSearching(true)
    const ack = await queueVersus(token, pool)
    if (!ack.ok) {
      setSearching(false)
      setQueueError(ack.error)
      toast.error(ack.error)
    }
  }

  useEffect(() => {
    if (!token || autoQueuedRef.current || searching) return
    const raw = searchParams.get("difficulty")?.toLowerCase()
    if (raw !== "easy" && raw !== "medium" && raw !== "hard") return
    autoQueuedRef.current = true
    void startSearch(raw)
  }, [token, searchParams, searching])

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

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create lobby"
        description="Set up your game and invite a friend. Practice only — no ELO or ranked stats."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!token || creatingRoom}
              onClick={() => void handleCreateRoom()}
            >
              {creatingRoom ? "Creating…" : "Create room"}
            </Button>
          </>
        }
      >
        <Field
          label="Lobby name"
          placeholder="HackIT Room"
          value={roomName}
          maxLength={60}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Difficulty</span>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRoomDifficulty(option.id)}
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  roomDifficulty === option.id
                    ? "border-highlight bg-highlight/15 text-accent"
                    : "border-border bg-primary/40 text-muted hover:border-highlight/40"
                }`}
              >
                <div className="font-semibold text-sm text-accent">{option.label}</div>
                <div className="text-[11px] mt-0.5 opacity-80">{option.duration}</div>
              </button>
            ))}
          </div>
        </div>
        <Field
          label="Password (optional)"
          type="password"
          placeholder="Leave blank for open"
          value={roomPassword}
          maxLength={128}
          onChange={(e) => setRoomPassword(e.target.value)}
        />
      </Modal>

      <Modal
        open={joinOpen}
        onClose={() => {
          setJoinOpen(false)
          setJoinError(null)
        }}
        title="Join lobby"
        description="Enter the room code shared by the host."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setJoinOpen(false)
                setJoinError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!token || !joinRoomId.trim() || joiningRoom}
              onClick={() => void handleJoinRoom()}
            >
              {joiningRoom ? "Joining…" : "Join room"}
            </Button>
          </>
        }
      >
        <Field
          label="Lobby ID"
          placeholder="Room ID"
          value={joinRoomId}
          onChange={(e) => {
            setJoinRoomId(e.target.value)
            if (joinError) setJoinError(null)
          }}
          autoFocus
        />
        <Field
          label="Password"
          type="password"
          placeholder="If required"
          value={joinPassword}
          onChange={(e) => {
            setJoinPassword(e.target.value)
            if (joinError) setJoinError(null)
          }}
          error={joinError ?? undefined}
        />
      </Modal>
    </>
  )
}

export default Versus
