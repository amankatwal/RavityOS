"use client"

import { CircleCheck, CircleX, Clock3, Eye, FileOutput, LoaderCircle } from "lucide-react"
import { useState, type FormEvent } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AnimatedButton } from "@/components/ui/AnimatedButton"

type AgentRunResultSheetProps = {
  runId: string
  name: string
  task: string
  status: string
  updatedAt: string
  output: unknown
}

type AgentRunOutput = {
  message?: string
  result?: string | null
  intervention?: {
    type?: string
    action?: string
    toolName?: string | null
  } | null
}

function parseAgentRunOutput(output: unknown): AgentRunOutput | null {
  let value = output
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const intervention = record.intervention
  const parsedIntervention =
    typeof intervention === "object" && intervention !== null && !Array.isArray(intervention)
      ? intervention as Record<string, unknown>
      : null

  return {
    message: typeof record.message === "string" ? record.message : undefined,
    result: typeof record.result === "string" ? record.result : null,
    intervention: parsedIntervention
      ? {
          type: typeof parsedIntervention.type === "string" ? parsedIntervention.type : undefined,
          action: typeof parsedIntervention.action === "string" ? parsedIntervention.action : undefined,
          toolName: typeof parsedIntervention.toolName === "string" ? parsedIntervention.toolName : null,
        }
      : null,
  }
}

function toOutputText(output: unknown) {
  if (typeof output === "string") return output
  return ""
}

function getStatusAppearance(status: string) {
  if (status === "completed") {
    return { icon: CircleCheck, className: "border-emerald-700/20 bg-emerald-700/10 text-emerald-700" }
  }
  if (status === "failed") {
    return { icon: CircleX, className: "border-red-700/20 bg-red-700/10 text-red-700" }
  }
  if (status === "running" || status === "queued") {
    return { icon: LoaderCircle, className: "border-amber-700/20 bg-amber-700/10 text-amber-700" }
  }
  return { icon: Clock3, className: "border-border bg-muted text-muted-foreground" }
}

export default function AgentRunResultSheet({
  runId,
  name,
  task,
  status,
  updatedAt,
  output,
}: AgentRunResultSheetProps) {
  const [humanResponse, setHumanResponse] = useState("")
  const [responseSent, setResponseSent] = useState(false)
  const [responseError, setResponseError] = useState("")
  const parsedOutput = parseAgentRunOutput(output)
  const resultText = parsedOutput ? "" : toOutputText(output)
  const statusAppearance = getStatusAppearance(status)
  const StatusIcon = statusAppearance.icon

  async function submitHumanResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResponseError("")

    try {
      const response = await fetch("/api/agent/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, response: humanResponse }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to send your response")
      }
      setResponseSent(true)
      setHumanResponse("")
    } catch (error) {
      setResponseError(error instanceof Error ? error.message : "Failed to send your response")
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
            <Eye /> View
          </Button>
        }
      />
      <SheetContent className="data-[side=right]:w-screen data-[side=right]:sm:max-w-none lg:data-[side=right]:w-1/2">
        <SheetHeader className="border-b border-border/70 px-6 pb-5 pt-7">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <FileOutput className="size-4 text-chart-2" />
            Run details
          </div>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <SheetTitle className="truncate text-xl">{name}</SheetTitle>
              <SheetDescription className="mt-1">Agent execution result</SheetDescription>
            </div>
            <Badge variant="outline" className={`shrink-0 gap-1.5 capitalize ${statusAppearance.className}`}>
              <StatusIcon className={`size-3.5 ${status === "running" || status === "queued" ? "animate-spin" : ""}`} />
              {status}
            </Badge>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            Updated {updatedAt}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Task</h3>
            <p className="text-sm leading-6 text-foreground">{task || "No task details were saved."}</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Output</h3>
            </div>
            {parsedOutput?.message || parsedOutput?.result ? (
              <div className="space-y-4 text-sm leading-7 text-foreground">
                {parsedOutput.message && (
                  <div className="max-w-none overflow-x-auto break-words [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-chart-2 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-3 [&_p]:my-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-3">
                    <Markdown remarkPlugins={[remarkGfm]}>{parsedOutput.message}</Markdown>
                  </div>
                )}
                {parsedOutput.result && (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Result</h4>
                    <Markdown remarkPlugins={[remarkGfm]}>{parsedOutput.result}</Markdown>
                  </div>
                )}
              </div>
            ) : resultText ? (
              <div className="max-w-none overflow-x-auto break-words text-sm leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-chart-2 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-3 [&_p]:my-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-3">
                <Markdown remarkPlugins={[remarkGfm]}>{resultText}</Markdown>
              </div>
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-6 py-8 text-center">
                <FileOutput className="size-5 text-muted-foreground" />
                <p className="text-sm font-medium">No output available</p>
                <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                  This run has not saved a result yet.
                </p>
              </div>
            )}
          </section>

          {status === "awaiting_input" && (
            <section className="space-y-4 border-t border-border/70 pt-5">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Agent needs your input</h3>
                {parsedOutput?.intervention?.action && (
                  <div className="rounded-md border border-amber-700/20 bg-amber-700/5 p-4 text-sm leading-6 text-foreground">
                    <Markdown remarkPlugins={[remarkGfm]}>{parsedOutput.intervention.action}</Markdown>
                    {parsedOutput.intervention.toolName && (
                      <p className="mt-2 text-xs text-muted-foreground">Tool: {parsedOutput.intervention.toolName}</p>
                    )}
                  </div>
                )}
              </div>
              {responseSent ? (
                <p className="text-sm text-emerald-700">Response sent. The agent will continue its run.</p>
              ) : (
                <form className="space-y-3" onSubmit={submitHumanResponse}>
                  <label className="sr-only" htmlFor={`human-response-${runId}`}>Your response</label>
                  <textarea
                    id={`human-response-${runId}`}
                    className="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter the information the agent needs to continue..."
                    value={humanResponse}
                    onChange={(event) => setHumanResponse(event.target.value)}
                    required
                  />
                  {responseError && <p className="text-sm text-destructive">{responseError}</p>}
                  <AnimatedButton type="submit" disabled={!humanResponse.trim()}>Send response</AnimatedButton>
                </form>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}