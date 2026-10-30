import * as React from "react"
import { cn } from "cn"

type MessageProps = React.ComponentProps<"div"> & {
  align?: "start" | "end"
}

function Message({ align = "start", className, ...props }: MessageProps) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "flex w-full items-end gap-2",
        align === "end" ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    />
  )
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn("flex size-8 shrink-0 items-center justify-center", className)}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn("flex min-w-0 max-w-[85%] flex-col gap-1", className)}
      {...props}
    />
  )
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Message, MessageAvatar, MessageContent, MessageFooter }