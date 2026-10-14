import Question from "./Question"

const sampleQuestion = [
  {
    question: "What is HackIT?",
    answer:
      "HackIT is a web-based competitive programming platform where you can join online coding tournaments, solve algorithmic problems under time pressure, and compete on live scoreboards.",
  },
  {
    question: "Who can use HackIT?",
    answer:
      "HackIT is open to students, developers, and anyone who wants to practice or compete in programming contests — from beginners to experienced coders.",
  },
  {
    question: "How do I join a tournament?",
    answer:
      "Create an account, log in, go to the Tournaments page, and register for any open event. You'll wait in the lobby until the host starts or the player count is reached.",
  },
  {
    question: "What is Versus mode?",
    answer:
      "Versus lets you find a 1v1 match or create a private room to battle a friend on the same set of problems.",
  },
  {
    question: "How do I submit a solution?",
    answer:
      "During a contest, open a problem, write your code in the supported language, and hit Submit. Your solution is run against hidden test cases and you'll get instant pass/fail feedback.",
  },
  {
    question: "What programming languages are supported?",
    answer:
      "HackIT supports popular languages including C++, Java, Python, and JavaScript. The available languages may vary per tournament.",
  },
  {
    question: "How does ELO work?",
    answer:
      "Winning a 1v1 increases your 1v1 ELO; losing decreases it. Top 3 in a tournament gain tournament ELO; last place loses it (except when there are only 3 players — then everyone gains).",
  },
  {
    question: "Can I host my own tournament?",
    answer:
      "Yes. Verified users can create public or private tournaments, set a schedule, add moderators, and start manually or when a target player count is reached.",
  },
  {
    question: "What do tournament moderators do?",
    answer:
      "Moderators don't compete. During a live tournament they monitor rankings, players' code, and tab-switch alerts, warn players, and request suspensions. The host approves or rejects each request and can also disqualify players directly.",
  },
  {
    question: "I forgot my password. What should I do?",
    answer: "Use the Forgot Password option on the login page to reset your password through your registered email address.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes. HackIT implements authentication, authorization, and secure data handling practices to help protect user accounts and personal information.",
  },
]

const FAQ = () => {
  return (
    <div id="faq" className="page-container py-5 mt-12 sm:mt-16 pt-16 sm:pt-20 pb-8">
      <div className="text-center mb-8 sm:mb-10">
        <p className="ui-kicker mb-3 justify-center">Support</p>
        <h2 className="section-heading">FAQ</h2>
      </div>
      <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
        {sampleQuestion.map((question, i) => (
          <Question key={i} question={question} />
        ))}
      </div>
    </div>
  )
}

export default FAQ
