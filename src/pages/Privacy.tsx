import { Link } from "react-router-dom"
import Button from "../components/ui/Button"

const Privacy = () => {
  return (
    <div className="min-h-screen page-bg pb-16">
      <div className="page-container pt-10 sm:pt-14 max-w-3xl">
        <Link to="/" className="text-sm text-muted hover:text-highlight transition-colors">
          ← Back to Home
        </Link>
        <p className="ui-kicker mt-8 mb-2">Legal brief</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-accent tracking-tight">Privacy Policy</h1>
        <p className="text-muted text-sm mt-2">Last updated: August 2026 · Placeholder copy for the capstone UI.</p>

        <div className="ui-card mt-8 p-6 sm:p-8 space-y-6 text-sm sm:text-base text-muted leading-relaxed">
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">1. Information we collect</h2>
            <p>
              Account details such as name, email, authentication data, profile information, match history, and ELO
              ratings used to operate HackIT.
            </p>
          </section>
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">2. How we use it</h2>
            <p>
              To authenticate you, run tournaments and versus matches, compute rankings, send related notifications, and
              improve the product.
            </p>
          </section>
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">3. Sharing</h2>
            <p>
              We do not sell personal data. Limited information may be visible to other players (display name, ratings,
              contest results) as part of the competitive experience.
            </p>
          </section>
          <section>
            <h2 className="text-accent font-semibold text-lg mb-2">4. Contact</h2>
            <p>Questions about this policy can be directed to the HackIT project team at Cordova Public College.</p>
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

export default Privacy
