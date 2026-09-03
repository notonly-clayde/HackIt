import { useEffect, useRef } from "react"
import type { SeparatorProps } from "react-resizable-panels"
import { Separator } from "react-resizable-panels"
import { useHudSoundOptional } from "../../contexts/SoundContext"

type SplitHandleProps = SeparatorProps & {
  direction: "horizontal" | "vertical"
}

const SplitHandle = ({ direction, className = "", ...props }: SplitHandleProps) => {
  const isVertical = direction === "vertical"
  const { play } = useHudSoundOptional()
  const draggingRef = useRef(false)

  useEffect(() => {
    const stopDragging = () => {
      draggingRef.current = false
    }

    const onPointerMove = () => {
      if (draggingRef.current) play("glide")
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
    }
  }, [play])

  return (
    <Separator
      {...props}
      onPointerDown={(event) => {
        draggingRef.current = true
        props.onPointerDown?.(event)
      }}
      className={`group relative shrink-0 bg-border/60 hover:bg-highlight/30 transition-colors ${
        isVertical ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"
      } ${className}`}
    >
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-0.5 opacity-60 group-hover:opacity-100 ${
          isVertical ? "flex-col py-1" : "flex-row px-1"
        }`}
      >
        {Array.from({ length: isVertical ? 6 : 8 }).map((_, index) => (
          <span
            key={index}
            className="h-1 w-1 rounded-full bg-muted group-hover:bg-accent"
          />
        ))}
      </div>
    </Separator>
  )
}

export default SplitHandle
