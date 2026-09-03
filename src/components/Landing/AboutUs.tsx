const features = [
  {
    title: "Live Tournaments",
    description:
      "Join structured programming contests with timed rounds, ranked problems, and real-time scoreboards.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.02 5.228m4.02-5.228a6.003 6.003 0 00-4.02-5.228" />
      </svg>
    ),
  },
  {
    title: "1v1 Versus Battles",
    description:
      "Challenge a friend or rival head-to-head. Create a room, share the code, and compete on the same problem set.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    title: "Instant Judging",
    description:
      "Submit your solution and get immediate feedback. Every test case is evaluated automatically so you can iterate fast.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Track Your Progress",
    description:
      "Climb both 1v1 and tournament ELO boards, review past contests, and sharpen skills across difficulty levels.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
]

const steps = [
  { number: "01", label: "Create an account", detail: "Sign up in seconds and verify your email to get started." },
  { number: "02", label: "Pick your mode", detail: "Enter a tournament or start a 1v1 versus room with friends." },
  { number: "03", label: "Code under pressure", detail: "Solve algorithmic problems within the time limit in a LeetCode-style editor." },
  { number: "04", label: "Climb the ranks", detail: "Earn ELO, beat the clock, and rise on the live scoreboard." },
]

const AboutUs = () => {
  return (
    <div id="about" className="page-container py-5 mt-12 sm:mt-16 pt-16 sm:pt-20 pb-12 sm:pb-20">
      <div className="text-center mb-10 sm:mb-14">
        <p className="ui-kicker mb-3 justify-center">Why HackIT</p>
        <h2 className="section-heading">Compete. Learn. Grow.</h2>
        <p className="text-muted text-sm sm:text-base lg:text-lg max-w-3xl mx-auto mt-4 leading-relaxed px-2">
          HackIT is a web-based competitive programming platform that empowers students and developers
          to sharpen their problem-solving skills through real-time coding tournaments and head-to-head battles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-12 sm:mb-20">
        {features.map((feature) => (
          <div key={feature.title} className="ui-card ui-card-hover p-5 sm:p-6 flex gap-4">
            <div className="ui-icon-box">{feature.icon}</div>
            <div>
              <h3 className="text-accent font-semibold text-lg mb-1.5 tracking-tight">{feature.title}</h3>
              <p className="text-muted text-sm sm:text-base leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-2xl sm:text-3xl text-center text-accent mb-8 sm:mb-10 tracking-tight">
          How It Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div key={step.number} className="ui-card p-5 sm:p-6 text-center">
              <span className="inline-block text-highlight font-bold text-2xl sm:text-3xl tabular-nums tracking-tight border-b border-highlight/30 pb-1">
                {step.number}
              </span>
              <h4 className="text-accent font-semibold text-base mt-4 mb-2">{step.label}</h4>
              <p className="text-muted text-sm leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AboutUs
