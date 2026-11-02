"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useActivityStore } from "../clientStore"
import moment from "moment"
import { Badge } from '@/components/ui/badge'
import { Activity, ArrowRight, CircleCheck, CircleX, Clock3, LoaderCircle, MessageCircleQuestion, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AgentRunResultSheet from './AgentRunResultSheet'
import Link from "next/link"

type ActivityFilter = "all" | "active" | "awaiting_input" | "completed" | "failed"

const filters: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "All runs" },
  { value: "active", label: "In progress" },
  { value: "awaiting_input", label: "Needs input" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
]

export default function AgentAcitivityTable() {
  const { fetchAgentRuns, agentRunsLoader, agentRuns, agentRunsError } = useActivityStore()
  const [filter, setFilter] = useState<ActivityFilter>("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    void fetchAgentRuns()
    const refreshInterval = window.setInterval(() => void fetchAgentRuns(), 5000)
    return () => window.clearInterval(refreshInterval)
  }, [fetchAgentRuns])

  const counts: Record<ActivityFilter, number> = {
    all: agentRuns.length,
    active: agentRuns.filter((run) => ["queued", "running"].includes(run.status)).length,
    awaiting_input: agentRuns.filter((run) => run.status === "awaiting_input").length,
    completed: agentRuns.filter((run) => run.status === "completed").length,
    failed: agentRuns.filter((run) => run.status === "failed").length,
  }
  const normalizedQuery = query.trim().toLowerCase()
  const visibleRuns = agentRuns.filter((run) => {
    const matchesFilter = filter === "all"
      || (filter === "active" && ["queued", "running"].includes(run.status))
      || run.status === filter
    const matchesQuery = !normalizedQuery || `${run.name} ${run.task}`.toLowerCase().includes(normalizedQuery)
    return matchesFilter && matchesQuery
  })

  const statusSummary = [
    { label: "Total runs", value: counts.all, icon: Activity, color: "text-chart-2" },
    { label: "Completed", value: counts.completed, icon: CircleCheck, color: "text-emerald-700" },
    { label: "In progress", value: counts.active, icon: Clock3, color: "text-amber-700" },
    { label: "Needs input", value: counts.awaiting_input, icon: MessageCircleQuestion, color: "text-orange-700" },
    { label: "Failed", value: counts.failed, icon: CircleX, color: "text-rose-700" },
  ]

  return (
    <div className="space-y-5">
      <section aria-label="Activity summary" className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-5">
        {statusSummary.map(({ label, value, icon: Icon, color }) => <div key={label} className="border-b border-r border-border bg-card px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon aria-hidden="true" className={`size-4 ${color}`} /></div>
          <p className="mt-3 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
        </div>)}
      </section>

      <section className="border border-border bg-card">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-sm">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search activity" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agents or tasks" className="h-10 pl-9 pr-9 text-sm" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
          </div>
          <Button type="button" variant="outline" size="lg" disabled={agentRunsLoader} onClick={() => void fetchAgentRuns()} className="w-full sm:w-auto">
            <RefreshCw aria-hidden="true" className={`size-4 ${agentRunsLoader ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto border-y border-border px-4 sm:px-5">
          <div role="group" aria-label="Filter activity by status" className="flex min-w-max gap-1 py-2">
            {filters.map((option) => <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`inline-flex h-8 items-center gap-2 border px-3 text-xs font-medium transition-colors ${filter === option.value ? "border-foreground bg-foreground text-background" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {option.label}<span className={filter === option.value ? "opacity-70" : "text-muted-foreground"}>{counts[option.value]}</span>
            </button>)}
          </div>
        </div>

        {agentRunsError && agentRuns.length > 0 && <div role="alert" className="flex items-center justify-between gap-4 border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs text-destructive">
          <span>{agentRunsError} Showing the latest available results.</span><button type="button" className="font-semibold underline underline-offset-2" onClick={() => void fetchAgentRuns()}>Retry</button>
        </div>}

        <Table className="min-w-190">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-45 px-5 text-[11px] uppercase text-muted-foreground">Agent</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Task</TableHead>
              <TableHead className="w-37.5 text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="w-37.5 text-[11px] uppercase text-muted-foreground">Last updated</TableHead>
              <TableHead className="w-30 text-right text-[11px] uppercase text-muted-foreground">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentRunsLoader && agentRuns.length === 0 ? <TableRow><TableCell colSpan={5} className="h-36 text-center">
              <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Loading activity</span>
            </TableCell></TableRow> : null}
            {!agentRunsLoader && agentRunsError && agentRuns.length === 0 ? <TableRow><TableCell colSpan={5} className="h-36 text-center">
              <div className="space-y-2"><p className="text-sm font-medium">Activity could not be loaded</p><p className="text-xs text-muted-foreground">{agentRunsError}</p><button type="button" onClick={() => void fetchAgentRuns()} className="text-xs font-semibold text-primary hover:underline">Try again</button></div>
            </TableCell></TableRow> : null}
            {!agentRunsLoader && !agentRunsError && agentRuns.length === 0 ? <TableRow><TableCell colSpan={5} className="h-52 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center">
                <span className="flex size-10 items-center justify-center bg-chart-2/10 text-chart-2"><Activity aria-hidden="true" className="size-5" /></span>
                <p className="mt-3 text-sm font-semibold">No agent activity yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">When your agents run, their status and results will appear here.</p>
                <Link href="/dashboard/agents" className="mt-4 inline-flex h-8 items-center gap-2 border border-border px-3 text-xs font-semibold hover:bg-muted">Go to agents <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
              </div>
            </TableCell></TableRow> : null}
            {!agentRunsLoader && agentRuns.length > 0 && visibleRuns.length === 0 ? <TableRow><TableCell colSpan={5} className="h-36 text-center">
              <div className="space-y-2"><p className="text-sm font-medium">No matching runs</p><p className="text-xs text-muted-foreground">Try a different search or status filter.</p><button type="button" onClick={() => { setQuery(""); setFilter("all") }} className="text-xs font-semibold text-primary hover:underline">Clear filters</button></div>
            </TableCell></TableRow> : null}
            {visibleRuns.map((agent) => <TableRow key={agent.id} className={agent.status === "awaiting_input" ? "bg-amber-700/3" : undefined}>
              <TableCell className="px-5 py-4 font-medium">{agent.name || "Unnamed agent"}</TableCell>
              <TableCell className="max-w-105 whitespace-normal py-4 text-muted-foreground"><span className="line-clamp-2">{agent.task || "No task details"}</span></TableCell>
              <TableCell><RunStatus status={agent.status} /></TableCell>
              <TableCell title={moment(agent.updatedAt).format("MMM D, YYYY h:mm A")} className="text-muted-foreground">{moment(agent.updatedAt).fromNow()}</TableCell>
              <TableCell className="text-right"><AgentRunResultSheet
                runId={agent.id}
                name={agent.name}
                task={agent.task}
                status={agent.status}
                updatedAt={moment(agent.updatedAt).format("MMM D, YYYY h:mm A")}
                output={agent.output}
              /></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          <span>{visibleRuns.length} of {agentRuns.length} runs</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 animate-pulse bg-emerald-600" /> Refreshes every 5 seconds</span>
        </div>
      </section>
    </div>
  )
}

function RunStatus({ status }: { status: string }) {
  const appearance = status === "completed"
    ? { icon: CircleCheck, label: "Completed", classes: "border-emerald-700/20 bg-emerald-700/5 text-emerald-700" }
    : status === "failed"
      ? { icon: CircleX, label: "Failed", classes: "border-rose-700/20 bg-rose-700/5 text-rose-700" }
      : status === "awaiting_input"
        ? { icon: MessageCircleQuestion, label: "Needs input", classes: "border-amber-700/25 bg-amber-700/5 text-amber-700" }
        : status === "running"
          ? { icon: LoaderCircle, label: "Running", classes: "border-chart-2/25 bg-chart-2/5 text-chart-2" }
          : { icon: Clock3, label: status.replaceAll("_", " "), classes: "border-border bg-muted text-muted-foreground" }
  const Icon = appearance.icon

  return <Badge variant="outline" className={`gap-1.5 whitespace-nowrap px-2 py-1 text-[11px] capitalize ${appearance.classes}`}>
    <Icon aria-hidden="true" className={`size-3.5 ${status === "running" ? "animate-spin" : ""}`} />{appearance.label}
  </Badge>
}
