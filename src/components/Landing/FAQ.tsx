
import Question from './Question'

const sampleQuestion = [
    {
        question: "What is HackIT?",
        answer: "HackIT is a web-based competitive programming platform where you can join online coding tournaments, solve algorithmic problems under time pressure, and compete on live scoreboards."
    },
    {
        question: "Who can use HackIT?",
        answer: "HackIT is open to students, developers, and anyone who wants to practice or compete in programming contests — from beginners to experienced coders."
    },
    {
        question: "How do I join a tournament?",
        answer: "Create an account, log in, go to the Tournaments page, and register for any open event. You'll be able to enter the contest lobby when it starts."
    },
    {
        question: "What is Versus mode?",
        answer: "Versus lets you create a private room or join one with a room code to battle a friend in a 1-on-1 programming contest on the same set of problems."
    },
    {
        question: "How do I submit a solution?",
        answer: "During a contest, open a problem, write your code in the supported language, and hit Submit. Your solution is run against hidden test cases and you'll get instant pass/fail feedback."
    },
    {
        question: "What programming languages are supported?",
        answer: "HackIT supports popular languages including C++, Java, Python, and JavaScript. The available languages may vary per tournament."
    },
    {
        question: "How is scoring calculated?",
        answer: "Points are awarded based on problems solved and time taken. Faster correct submissions rank higher on the leaderboard. Wrong submissions may incur a time penalty depending on the contest rules."
    },
    {
        question: "Can I practice outside of tournaments?",
        answer: "Yes. You can use Versus mode to practice with friends anytime, and past tournament problems will be available for review after events conclude."
    },
    {
        question: "I forgot my password. What should I do?",
        answer: "Use the Forgot Password option on the login page to reset your password through your registered email address."
    },
    {
        question: "Is my personal information secure?",
        answer: "Yes. HackIT implements authentication, authorization, and secure data handling practices to help protect user accounts and personal information."
    }
];
const FAQ = () => {
  return (
    <div id='faq' className='text-highlight flex flex-col gap-5 page-container py-5 mt-12 sm:mt-16 pt-16 sm:pt-20 pb-12'>
        <h2 className='section-heading text-center'>FAQ's</h2>
        <div className='flex flex-col gap-2'>
            {
                sampleQuestion.map((question, i) => (
                    <Question key={i} question={question}/>
                )) 
            }
        </div>
    </div>
  )
}

export default FAQ