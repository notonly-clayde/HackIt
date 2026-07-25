import illustration from "../../assets/Group 8.svg"

const highlights = [
  "Live tournament scoreboards",
  "1v1 versus battles",
  "Instant code judging",
]

type AuthPanelProps = {
  variant?: "login" | "signup"
}

const AuthPanel = ({ variant = "login" }: AuthPanelProps) => {
  const headline =
    variant === "signup"
      ? "Join the arena and start competing."
      : "Welcome back, coder."

  const subtext =
    variant === "signup"
      ? "Create your account to enter online programming tournaments, challenge rivals, and climb the leaderboard."
      : "Sign in to jump back into tournaments, pick up where you left off, and keep sharpening your skills."

  return (
    <div className="relative flex-1 min-h-[40vh] md:min-h-screen bg-accent-gradient flex flex-col items-center justify-center overflow-hidden px-6 sm:px-12 py-12 md:py-16">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-highlight blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-midtone blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <span className="text-accent font-bold text-2xl tracking-wide mb-8">HackIT</span>

        <img
          src={illustration}
          alt="Competitive programming illustration"
          className="w-full max-w-[16rem] sm:max-w-xs md:max-w-md mb-6 sm:mb-10 drop-shadow-lg"
        />

        <h2 className="font-bold text-2xl sm:text-3xl bg-gradient-to-b from-highlight to-accent bg-clip-text text-transparent leading-tight">
          {headline}
        </h2>
        <p className="text-accent/80 mt-4 leading-relaxed">{subtext}</p>

        <ul className="mt-8 flex flex-col gap-3 self-stretch">
          {highlights.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl bg-primary/30 border border-highlight/20 px-4 py-3 text-accent text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-highlight/20 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default AuthPanel
