export type HudSoundCue =
  | "tap"
  | "deploy"
  | "dismiss"
  | "toggle"
  | "confirm"
  | "deny"
  | "scan"
  | "transmit"
  | "alert"
  | "link"
  | "glide"
  | "urgency"
  | "victory"
  | "defeat"

const THROTTLE_MS: Partial<Record<HudSoundCue, number>> = {
  tap: 80,
  toggle: 100,
  deploy: 120,
  dismiss: 100,
  glide: 120,
  urgency: 900,
}

let audioContext: AudioContext | null = null
const lastPlayedAt = new Map<HudSoundCue, number>()

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export async function unlockHudAudio(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null

  const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null

  if (!audioContext) {
    audioContext = new AudioCtx()
  }

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume()
    } catch {
      return null
    }
  }

  return audioContext
}

function getContext(): AudioContext | null {
  if (!audioContext || audioContext.state === "closed") return null
  return audioContext
}

function shouldThrottle(cue: HudSoundCue): boolean {
  const minGap = THROTTLE_MS[cue]
  if (!minGap) return false

  const now = performance.now()
  const last = lastPlayedAt.get(cue) ?? 0
  if (now - last < minGap) return true

  lastPlayedAt.set(cue, now)
  return false
}

type ToneSpec = {
  frequency: number
  type: OscillatorType
  gain: number
  attack: number
  decay: number
  duration: number
  detune?: number
}

function playTone(ctx: AudioContext, master: GainNode, spec: ToneSpec, startAt: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = spec.type
  osc.frequency.setValueAtTime(spec.frequency, startAt)
  if (spec.detune) osc.detune.setValueAtTime(spec.detune, startAt)

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(spec.gain, startAt + spec.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + spec.decay)

  osc.connect(gain)
  gain.connect(master)
  osc.start(startAt)
  osc.stop(startAt + spec.duration)
}

function playNoiseBurst(ctx: AudioContext, master: GainNode, startAt: number, duration: number, gain: number) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }

  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const envelope = ctx.createGain()

  source.buffer = buffer
  filter.type = "highpass"
  filter.frequency.setValueAtTime(900, startAt)

  envelope.gain.setValueAtTime(gain, startAt)
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(master)
  source.start(startAt)
  source.stop(startAt + duration)
}

function scheduleCue(ctx: AudioContext, master: GainNode, cue: HudSoundCue, startAt: number) {
  switch (cue) {
    case "tap":
      playTone(ctx, master, { frequency: 520, type: "square", gain: 0.045, attack: 0.004, decay: 0.035, duration: 0.04 }, startAt)
      break
    case "deploy":
      playTone(ctx, master, { frequency: 440, type: "sine", gain: 0.05, attack: 0.005, decay: 0.04, duration: 0.05 }, startAt)
      playTone(ctx, master, { frequency: 660, type: "sine", gain: 0.04, attack: 0.005, decay: 0.05, duration: 0.06 }, startAt + 0.03)
      break
    case "dismiss":
      playTone(ctx, master, { frequency: 360, type: "sine", gain: 0.035, attack: 0.004, decay: 0.045, duration: 0.05 }, startAt)
      break
    case "toggle":
      playTone(ctx, master, { frequency: 640, type: "square", gain: 0.04, attack: 0.003, decay: 0.035, duration: 0.04 }, startAt)
      break
    case "confirm":
      playTone(ctx, master, { frequency: 523, type: "sine", gain: 0.055, attack: 0.006, decay: 0.06, duration: 0.07 }, startAt)
      playTone(ctx, master, { frequency: 784, type: "sine", gain: 0.04, attack: 0.008, decay: 0.08, duration: 0.09 }, startAt + 0.025)
      break
    case "deny":
      playTone(ctx, master, { frequency: 180, type: "sawtooth", gain: 0.05, attack: 0.004, decay: 0.08, duration: 0.09 }, startAt)
      playNoiseBurst(ctx, master, startAt, 0.06, 0.02)
      break
    case "scan":
      playTone(ctx, master, { frequency: 280, type: "sine", gain: 0.04, attack: 0.01, decay: 0.1, duration: 0.12 }, startAt)
      playTone(ctx, master, { frequency: 520, type: "sine", gain: 0.035, attack: 0.02, decay: 0.11, duration: 0.12 }, startAt + 0.04)
      break
    case "transmit":
      playTone(ctx, master, { frequency: 420, type: "square", gain: 0.04, attack: 0.005, decay: 0.07, duration: 0.08 }, startAt)
      playTone(ctx, master, { frequency: 560, type: "sine", gain: 0.035, attack: 0.01, decay: 0.09, duration: 0.1 }, startAt + 0.035)
      break
    case "alert":
      playTone(ctx, master, { frequency: 740, type: "triangle", gain: 0.05, attack: 0.006, decay: 0.08, duration: 0.09 }, startAt)
      playTone(ctx, master, { frequency: 880, type: "triangle", gain: 0.04, attack: 0.01, decay: 0.12, duration: 0.13 }, startAt + 0.05)
      break
    case "link":
      playTone(ctx, master, { frequency: 480, type: "sine", gain: 0.045, attack: 0.005, decay: 0.06, duration: 0.07 }, startAt)
      playTone(ctx, master, { frequency: 620, type: "sine", gain: 0.035, attack: 0.008, decay: 0.07, duration: 0.08 }, startAt + 0.025)
      break
    case "glide":
      playNoiseBurst(ctx, master, startAt, 0.06, 0.02)
      break
    case "urgency":
      playTone(ctx, master, { frequency: 880, type: "sawtooth", gain: 0.075, attack: 0.002, decay: 0.11, duration: 0.12 }, startAt)
      playTone(ctx, master, { frequency: 1180, type: "square", gain: 0.06, attack: 0.003, decay: 0.13, duration: 0.14 }, startAt + 0.015)
      playNoiseBurst(ctx, master, startAt, 0.07, 0.03)
      break
    case "victory":
      playTone(ctx, master, { frequency: 523, type: "sine", gain: 0.06, attack: 0.006, decay: 0.12, duration: 0.14 }, startAt)
      playTone(ctx, master, { frequency: 659, type: "sine", gain: 0.055, attack: 0.008, decay: 0.14, duration: 0.16 }, startAt + 0.08)
      playTone(ctx, master, { frequency: 784, type: "sine", gain: 0.05, attack: 0.01, decay: 0.2, duration: 0.22 }, startAt + 0.16)
      break
    case "defeat":
      playTone(ctx, master, { frequency: 220, type: "sawtooth", gain: 0.055, attack: 0.008, decay: 0.16, duration: 0.18 }, startAt)
      playTone(ctx, master, { frequency: 165, type: "triangle", gain: 0.045, attack: 0.01, decay: 0.22, duration: 0.24 }, startAt + 0.09)
      playNoiseBurst(ctx, master, startAt + 0.04, 0.08, 0.025)
      break
    default:
      break
  }
}

// Cue tone gains are tuned low (~0.05); this lifts overall output while keeping
// stacked tones well under clipping at full volume.
const OUTPUT_BOOST = 4

export function playHudCue(cue: HudSoundCue, volume = DEFAULT_VOLUME): void {
  const ctx = getContext()
  if (!ctx || ctx.state !== "running") return
  if (shouldThrottle(cue)) return

  const master = ctx.createGain()
  master.gain.setValueAtTime(Math.min(1, Math.max(0, volume)) * OUTPUT_BOOST, ctx.currentTime)
  master.connect(ctx.destination)

  scheduleCue(ctx, master, cue, ctx.currentTime)
}

export const STORAGE_KEYS = {
  enabled: "hackit.soundEnabled",
  volume: "hackit.soundVolume",
} as const

export const DEFAULT_VOLUME = 0.6
