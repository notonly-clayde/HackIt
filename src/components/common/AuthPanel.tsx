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
    variant === "signup" ? "Join the arena and start competing." : "Welcome back, coder."

  const subtext =
    variant === "signup"
      ? "Create your account to enter online programming tournaments, challenge rivals, and climb the leaderboard."
      : "Sign in to jump back into tournaments, pick up where you left off, and keep sharpening your skills."

  return (
    <div className="relative hidden md:flex flex-1 min-h-0 h-full page-bg flex-col items-center justify-center overflow-hidden px-8 lg:px-12 py-6 lg:py-8">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-96 w-96 bg-highlight blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 bg-midtone blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <span className="ui-kicker mb-4">HackIT</span>

        <div className="ui-card p-3 mb-5 w-full max-w-[11rem] sm:max-w-[13rem] lg:max-w-[15rem]">
          <img
            src={illustration}
            alt="Competitive programming illustration"
            className="w-full drop-shadow-lg"
          />
        </div>

        <h2 className="font-bold text-2xl lg:text-3xl text-accent leading-tight tracking-tight">{headline}</h2>
        <p className="text-muted mt-3 leading-relaxed text-sm lg:text-base max-w-sm">{subtext}</p>

        <ul className="auth-panel-highlights mt-5 flex w-full max-w-sm flex-col gap-2">
          {highlights.map((item) => (
            <li key={item} className="ui-card flex items-center gap-3 px-3 py-2.5 text-accent text-sm text-left">
              <span className="ui-icon-box !h-6 !w-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
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
