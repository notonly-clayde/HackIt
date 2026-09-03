import { useState } from "react"

const Question = ({ question }: { question: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="ui-card overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-highlight/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-accent text-sm sm:text-base font-medium pr-2">{question.question}</span>
        <span
          className={`shrink-0 flex h-8 w-8 items-center justify-center border border-border text-highlight transition-transform ${
            isOpen ? "rotate-180 bg-highlight/10" : ""
          }`}
          style={{ clipPath: "polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-sm sm:text-base text-muted leading-relaxed border-t border-border pt-4 animate-[fade-in_0.15s_ease-out]">
          {question.answer}
        </div>
      )}
    </div>
  )
}

export default Question
