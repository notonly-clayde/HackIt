import Card from "./Card"

type QueryLoadingCardProps = {
  message?: string
}

const QueryLoadingCard = ({ message = "Loading…" }: QueryLoadingCardProps) => (
  <Card className="px-6 py-10 text-center text-muted">{message}</Card>
)

export default QueryLoadingCard
