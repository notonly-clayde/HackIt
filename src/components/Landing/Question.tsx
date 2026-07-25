import { useState } from 'react'

const Question = ({ question }: { question: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-primary rounded-xl">
      <div className="bg-secondary p-4 rounded-xl text-sm sm:text-base lg:text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-accent pr-2">{question.question}</span>
        <button
          type="button"
          className="cursor-pointer hover:border border-highlight/30 p-2 px-4 rounded-lg text-sm shrink-0 self-start sm:self-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>
      <div className={`${isOpen ? "block" : "hidden"} p-4 text-sm sm:text-base lg:text-lg text-midtone leading-relaxed`}>
        {question.answer}
      </div>
    </div>
  )
}

export default Question
