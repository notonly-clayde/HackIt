import { Link } from "react-router-dom"
import Button from "../components/ui/Button"

const NotFound = () => {
  return (
    <div className="min-h-screen page-bg flex flex-col items-center justify-center px-4 text-center">
      <p className="ui-kicker mb-3">Sector 404</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-accent tracking-tight">Page not found</h1>
      <p className="text-muted mt-3 max-w-md text-sm sm:text-base">
        That route does not exist in the arena. Head back home or browse tournaments.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link to="/">
          <Button variant="primary">Home</Button>
        </Link>
        <Link to="/tournament">
          <Button variant="secondary">Tournaments</Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
