import { Navigate, useParams } from "react-router-dom"

/** @deprecated Prefer /tournament/:id/spectate — host controls are role-gated there. */
const TournamentHostPage = () => {
  const { id } = useParams()
  return <Navigate to={id ? `/tournament/${id}/spectate` : "/tournament"} replace />
}

export default TournamentHostPage
