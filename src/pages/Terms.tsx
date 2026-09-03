import { Link } from "react-router-dom"
import Button from "../components/ui/Button"

const Terms = () => {
  return (
    <div className="min-h-screen page-bg pb-16">
      <div className="page-container pt-10 sm:pt-14 max-w-3xl">
        <Link to="/" className="text-sm text-muted hover:text-highlight transition-colors">
          ← Back to Home
        </Link>
        <p className="ui-kicker mt-8 mb-2">Legal brief</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-accent tracking-tight">Terms of Service</h1>
        <p className="text-muted text-sm mt-2">Last updated: August 2026 · Placeholder copy for the capstone UI.</p>

        <div className="ui-card mt-8 p-6 sm:p-8 space-y-6 text-sm sm:text-base text-muted leading-relaxed">
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">1. Acceptance</h2>
            <p>
              By creating an account or using HackIT, you agree to these Terms. If you do not agree, do not use the
              platform.
            </p>
          </section>
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">2. Accounts</h2>
            <p>
              You are responsible for safeguarding your credentials and for activity under your account. Hosting and
              moderating require a verified email address.
            </p>
          </section>
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">3. Fair play</h2>
            <p>
              Cheating, harassment, and abuse of tournaments or other users is prohibited. Moderators may warn or
              disqualify participants according to event rules.
            </p>
          </section>
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">4. Content</h2>
            <p>
              Code and submissions you make during contests may be visible to hosts, moderators, and spectators as
              configured for that event.
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link to="/">
            <Button variant="secondary">Return home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Terms
