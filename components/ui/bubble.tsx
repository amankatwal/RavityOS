import * as React from "react"
import { cn } from "cn"

type BubbleProps = React.ComponentProps<"div"> & {
  variant?: "default" | "muted"
}

function Bubble({ className, variant = "default", ...props }: BubbleProps) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      className={cn(
        "w-fit max-w-full wrap-break-word rounded-2xl px-4 py-2 text-sm",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "muted" && "bg-muted text-foreground",
        className
      )}
      {...props}
    />
  )
}

function BubbleContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="bubble-content" className={cn("whitespace-pre-wrap", className)} {...props} />
}

export { Bubble, BubbleContent }