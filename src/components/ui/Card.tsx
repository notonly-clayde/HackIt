import type { HTMLAttributes, ReactNode } from "react"

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  hover?: boolean
}

const Card = ({ children, hover = false, className = "", ...rest }: CardProps) => {
  return (
    <div className={`ui-card ${hover ? "ui-card-hover" : ""} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export default Card
