type ContestFreezeOverlayProps = {
  isResuming: boolean
  secondsLeft: number | null
}

const ContestFreezeOverlay = ({ isResuming, secondsLeft }: ContestFreezeOverlayProps) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/60 backdrop-blur-md">
      <div className="text-center px-6 py-8 max-w-sm">
        {isResuming && secondsLeft != null && secondsLeft > 0 ? (
          <>
            <p className="ui-kicker mb-3 justify-center">Resuming</p>
            <p className="text-5xl sm:text-6xl font-bold tabular-nums text-accent tracking-tight">
              {secondsLeft}
            </p>
            <p className="text-muted text-sm mt-3">Contest resumes when the countdown reaches zero.</p>
          </>
        ) : isResuming && secondsLeft === 0 ? (
          <>
            <p className="ui-kicker mb-3 justify-center">Resuming</p>
            <p className="text-xl font-semibold text-accent">Contest is resuming…</p>
            <p className="text-muted text-sm mt-2">Hang tight while play is restored.</p>
          </>
        ) : (
          <>
            <p className="ui-kicker mb-3 justify-center">Paused</p>
            <p className="text-xl font-semibold text-accent">Contest paused by the host</p>
            <p className="text-muted text-sm mt-2">Problem details and editing are hidden until play resumes.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default ContestFreezeOverlay
