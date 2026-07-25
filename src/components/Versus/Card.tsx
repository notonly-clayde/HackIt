const Card = ({ text, onClick }: { text: string; url: string; onClick: () => void }) => {
  return (
    <div
      className="flex flex-col w-full max-w-xs sm:max-w-sm sm:w-72 lg:w-80 aspect-square bg-secondary p-2 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
      onClick={onClick}
    >
      <div className="bg-midtone flex-1 rounded-2xl min-h-[8rem]" />
      <p className="p-4 sm:p-6 lg:p-8 text-center font-bold text-xl sm:text-2xl text-accent">{text}</p>
    </div>
  )
}

export default Card
