import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"

type ProblemStatementProps = {
  content: string
  className?: string
}

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className)
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return <code {...props}>{children}</code>
  },
}

const ProblemStatement = ({ content, className = "" }: ProblemStatementProps) => {
  if (!content.trim()) {
    return null
  }

  return (
    <div className={`problem-markdown ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default ProblemStatement
