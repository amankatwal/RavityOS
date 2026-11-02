"use client"

import { useEffect, useState, type FormEvent } from "react"
import { motion } from "motion/react"
import { Activity, ArrowRight, ArrowUpRight, Bot, CalendarClock, CircleCheck, Clock3, LoaderCircle, Plus, RotateCw, Send, XCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useDashboardStore, type DashboardRun } from "./clientStore"

const dashboardItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
}

export default function DashboardPage() {
  const { agents, runs, loading, error, fetchDashboardData } = useDashboardStore()
  const { user } = useUser()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const displayName = user?.firstName || user?.fullName?.split(/\s+/)[0] || user?.username || "there"

  useEffect(() => {
    void fetchDashboardData()
    const refreshInterval = window.setInterval(() => void fetchDashboardData(), 5000)
    return () => window.clearInterval(refreshInterval)
  }, [fetchDashboardData])

  const completedRuns = runs.filter((run) => run.status === "completed").length
  const failedRuns = runs.filter((run) => run.status === "failed").length
  const activeRuns = runs.filter((run) => ["queued", "running"].includes(run.status))
  const inputRequiredRuns = runs.filter((run) => run.status === "awaiting_input")
  const upcomingSchedules = runs
    .filter((run) => run.status === "scheduled")
    .sort((first, second) => new Date(first.scheduledFor).getTime() - new Date(second.scheduledFor).getTime())
    .slice(0, 5)
  const resolvedRuns = completedRuns + failedRuns
  const activeAgents = agents.filter((agent) => agent.status?.toLowerCase() === "active").length
  const successRate = resolvedRuns ? Math.round((completedRuns / resolvedRuns) * 100) : 0
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    const count = runs.filter((run) => {
      const createdAt = new Date(run.createdAt)
      return createdAt >= date && createdAt < end
    }).length
    return { date, label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date), count }
  })
  const maxDailyRuns = Math.max(1, ...days.map((day) => day.count))
  const recentRuns = [...runs]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 5)

  return (
    <motion.div
      className="space-y-8 pb-8"
      id="overview"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.09 } } }}
      initial="hidden"
      animate="show"
    >
      <motion.section variants={dashboardItemVariants} className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p suppressHydrationWarning className="text-sm font-semibold text-chart-2">{greeting}, {displayName}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold">Agent overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your agents, execution health, and recent work in one place.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void fetchDashboardData()} disabled={loading} aria-label="Refresh analytics" title="Refresh analytics" className="inline-flex size-10 items-center justify-center border border-border bg-background hover:bg-muted disabled:opacity-50">
            <RotateCw aria-hidden="true" className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/agents" className="inline-flex h-10 items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85">
            <Plus aria-hidden="true" className="size-4" /> Create agent
          </Link>
        </div>
      </motion.section>

      {error && <motion.div variants={dashboardItemVariants} role="alert" className="flex items-center justify-between gap-4 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <span>{error}</span><button className="font-semibold underline underline-offset-4" onClick={() => void fetchDashboardData()}>Retry</button>
      </motion.div>}

      <motion.section variants={dashboardItemVariants} aria-label="Agent metrics" className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-4">
        <Metric label="Total agents" value={agents.length.toLocaleString()} detail={`${activeAgents} active`} icon={Bot} accent="text-chart-2" />
        <Metric label="Total runs" value={runs.length.toLocaleString()} detail="All recorded executions" icon={Activity} accent="text-chart-3" />
        <Metric label="Success rate" value={`${successRate}%`} detail={`${completedRuns} completed runs`} icon={CircleCheck} accent="text-emerald-600" />
        <Metric label="Needs attention" value={failedRuns.toLocaleString()} detail="Failed executions" icon={XCircle} accent="text-rose-600" />
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-2">
        <motion.section variants={dashboardItemVariants} className="border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div><h2 className="font-semibold">Running agents</h2><p className="mt-1 text-xs text-muted-foreground">Queued and active executions</p></div>
            <span className="text-sm font-semibold tabular-nums">{activeRuns.length}</span>
          </div>
          {activeRuns.length ? <div className="divide-y divide-border">
            {activeRuns.map((run) => {
              const isRunning = run.status === "running"
              const timestamp = new Date(run.startedAt ?? run.createdAt)
              const started = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(timestamp)
              return <motion.div key={run.id} variants={dashboardItemVariants} className="flex items-start gap-3 px-5 py-4">
                <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center ${isRunning ? "bg-chart-2/10 text-chart-2" : "bg-amber-500/10 text-amber-700"}`}>
                  {isRunning ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Clock3 aria-hidden="true" className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="truncate text-sm font-semibold">{run.agentConfig.name || "Agent run"}</p>
                    <span className={`text-[11px] font-semibold capitalize ${isRunning ? "text-chart-2" : "text-amber-700"}`}>{run.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{run.agentConfig.objective || "No task details available."}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{isRunning ? "Started" : "Queued"} {started}</p>
                </div>
              </motion.div>
            })}
          </div> : <div className="px-5 py-9 text-center">
            <Bot aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No agents are running</p>
            <p className="mt-1 text-xs text-muted-foreground">Queued or active executions will appear here.</p>
          </div>}
        </motion.section>

        <motion.section variants={dashboardItemVariants} className="border border-amber-700/25 bg-amber-700/3">
          <div className="flex items-center justify-between gap-4 border-b border-amber-700/15 px-5 py-4">
            <div><h2 className="font-semibold">Needs your input</h2><p className="mt-1 text-xs text-muted-foreground">Respond to let an agent continue</p></div>
            <span className="text-sm font-semibold tabular-nums">{inputRequiredRuns.length}</span>
          </div>
          {inputRequiredRuns.length ? <div className="divide-y divide-amber-700/15">
            {inputRequiredRuns.map((run) => {
              const intervention = getInterventionDetails(run.output)
              return <motion.div key={run.id} variants={dashboardItemVariants} className="space-y-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">{run.agentConfig.name || "Agent run"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{run.agentConfig.objective || "Agent execution"}</p>
                </div>
                <div className="border-l-2 border-amber-600 bg-amber-700/5 px-3 py-2.5 text-sm leading-6">
                  <p>{intervention.action}</p>
                  {intervention.toolName && <p className="mt-1 text-xs text-muted-foreground">Tool: {intervention.toolName}</p>}
                </div>
                <HumanInputForm runId={run.id} onResponseSent={() => void fetchDashboardData()} />
              </motion.div>
            })}
          </div> : <div className="px-5 py-9 text-center">
            <CircleCheck aria-hidden="true" className="mx-auto size-5 text-emerald-700" />
            <p className="mt-3 text-sm font-medium">No responses needed</p>
            <p className="mt-1 text-xs text-muted-foreground">Agents waiting on you will appear here.</p>
          </div>}
        </motion.section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.8fr)]">
        <motion.section variants={dashboardItemVariants} className="border border-border bg-card">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div><h2 className="font-semibold">Run activity</h2><p className="mt-1 text-xs text-muted-foreground">Executions started over the last seven days</p></div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 bg-chart-2" /> Runs</span>
          </div>
          <div className="px-5 pb-5 pt-6">
            <div className="grid h-48 grid-cols-7 items-end gap-3 sm:gap-5" role="img" aria-label={`${runs.length} total runs over the last seven days`}>
              {days.map((day) => <div key={day.date.toISOString()} className="flex h-full flex-col items-center justify-end gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">{day.count || ""}</span>
                <div className="flex h-36 w-full items-end border-b border-border bg-muted/50">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(day.count ? 12 : 3, (day.count / maxDailyRuns) * 100)}%` }} transition={{ duration: 0.55, delay: 0.25 }} className={`w-full ${day.count ? "bg-chart-2" : "bg-border"}`} />
                </div>
                <span className="text-xs text-muted-foreground">{day.label}</span>
              </div>)}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{runs.length ? `${runs.length} runs recorded across your workspace.` : "Run activity will appear here after your agents execute."}</p>
          </div>
        </motion.section>

        <motion.section variants={dashboardItemVariants} className="border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div><h2 className="font-semibold">Upcoming schedules</h2><p className="mt-1 text-xs text-muted-foreground">Next planned agent executions</p></div>
            <CalendarClock aria-hidden="true" className="size-4 text-chart-2" />
          </div>
          {upcomingSchedules.length ? <div className="divide-y divide-border">
            {upcomingSchedules.map((run) => <motion.div key={run.id} variants={dashboardItemVariants} className="flex items-center gap-3 px-5 py-4">
              <div className="flex size-11 shrink-0 flex-col items-center justify-center border border-chart-2/20 bg-chart-2/5 text-chart-2">
                <span className="text-[10px] font-semibold uppercase">{formatScheduleMonth(run.scheduledFor, run.timezone)}</span>
                <span className="text-base font-semibold leading-4 tabular-nums">{formatScheduleDay(run.scheduledFor, run.timezone)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{run.agentConfig.name || "Agent run"}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{run.agentConfig.objective || "Scheduled execution"}</p>
                <p className="mt-1 text-[11px] text-chart-2">{formatScheduleTime(run.scheduledFor, run.timezone)}</p>
              </div>
            </motion.div>)}
          </div> : <div className="px-5 py-9 text-center">
            <CalendarClock aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No upcoming runs</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Scheduled agent executions will appear here.</p>
            <Link href="/dashboard/agents" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Manage agent schedules <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
          </div>}
        </motion.section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.8fr)]">
        <motion.section variants={dashboardItemVariants} className="border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div><h2 className="font-semibold">Recent executions</h2><p className="mt-1 text-xs text-muted-foreground">The latest agent activity</p></div>
            <Link href="/dashboard/activity" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">All activity <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
          </div>
          {recentRuns.length ? <div className="divide-y divide-border">{recentRuns.map((run) => <RecentRun key={run.id} run={run} />)}</div> : <div className="px-5 py-10 text-center">
            <Activity aria-hidden="true" className="mx-auto size-5 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No executions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Start an agent to see its work appear here.</p>
            <Link href="/dashboard/agents" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Browse agents <ArrowRight className="size-3.5" /></Link>
          </div>}
        </motion.section>

        <motion.section variants={dashboardItemVariants} className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><h2 className="font-semibold">Your agents</h2><p className="mt-1 text-xs text-muted-foreground">Active and paused automations</p></div>
            <Link href="/dashboard/agents" aria-label="View all agents" title="View all agents" className="inline-flex size-8 items-center justify-center border border-border hover:bg-muted"><ArrowUpRight className="size-4" /></Link>
          </div>
          {agents.length ? <div className="divide-y divide-border">{agents.slice(0, 4).map((agent) => <div key={agent.agentId} className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center bg-chart-2/10 text-chart-2"><Bot className="size-4" /></span>
              <div className="min-w-0"><p className="truncate text-sm font-medium">{agent.name || "Unnamed agent"}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{agent.objective || "No objective set"}</p></div>
            </div>
            <span className={`shrink-0 text-[11px] font-semibold capitalize ${agent.status?.toLowerCase() === "active" ? "text-emerald-700" : "text-muted-foreground"}`}>{agent.status || "idle"}</span>
          </div>)}</div> : <div className="px-5 py-8 text-center"><p className="text-sm text-muted-foreground">Create your first agent to get started.</p>
            <Link href="/dashboard/agents" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Plus className="size-3.5" /> Create agent</Link>
          </div>}
        </motion.section>
      </section>
      {loading && !agents.length && !runs.length && <p role="status" className="text-center text-xs text-muted-foreground">Loading your workspace analytics...</p>}
    </motion.div>
  );
}

function getInterventionDetails(output: unknown) {
  let value = output
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return { action: "The agent is waiting for your response.", toolName: null }
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { action: "The agent is waiting for your response.", toolName: null }
  }

  const intervention = (value as Record<string, unknown>).intervention
  if (typeof intervention !== "object" || intervention === null || Array.isArray(intervention)) {
    return { action: "The agent is waiting for your response.", toolName: null }
  }

  const details = intervention as Record<string, unknown>
  return {
    action: typeof details.action === "string" && details.action.trim() ? details.action : "The agent is waiting for your response.",
    toolName: typeof details.toolName === "string" ? details.toolName : null,
  }
}

function HumanInputForm({ runId, onResponseSent }: { runId: string; onResponseSent: () => void }) {
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSending(true)

    try {
      const result = await fetch("/api/agent/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, response: response.trim() }),
      })
      const data = await result.json()
      if (!result.ok || !data.success) {
        throw new Error(data.message ?? "Unable to send your response")
      }
      setSent(true)
      setResponse("")
      onResponseSent()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send your response")
    } finally {
      setSending(false)
    }
  }

  if (sent) return <p role="status" className="text-xs font-medium text-emerald-700">Response sent. The agent will continue shortly.</p>

  return <form onSubmit={submitResponse} className="space-y-2">
    <label className="sr-only" htmlFor={`dashboard-response-${runId}`}>Your response to the agent</label>
    <textarea
      id={`dashboard-response-${runId}`}
      value={response}
      onChange={(event) => setResponse(event.target.value)}
      placeholder="Type your response..."
      required
      className="min-h-20 w-full resize-y border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <button type="submit" disabled={sending || !response.trim()} className="inline-flex h-9 items-center justify-center gap-2 bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50">
      {sending ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <Send aria-hidden="true" className="size-3.5" />}
      {sending ? "Sending..." : "Send response"}
    </button>
  </form>
}

function Metric({ label, value, detail, icon: Icon, accent }: { label: string; value: string; detail: string; icon: typeof Bot; accent: string }) {
  return <motion.div className="min-w-0 border-b border-r border-border bg-card p-4 sm:p-5" variants={dashboardItemVariants}>
    <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-medium text-muted-foreground">{label}</p><Icon aria-hidden="true" className={`size-4 shrink-0 ${accent}`} /></div>
    <p className="mt-4 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
  </motion.div>
}

function formatScheduleTime(value: string, timezone: string) {
  const date = new Date(value)
  const options: Intl.DateTimeFormatOptions = { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }

  try {
    return new Intl.DateTimeFormat("en", { ...options, timeZone: timezone }).format(date)
  } catch {
    return new Intl.DateTimeFormat("en", options).format(date)
  }
}

function formatScheduleMonth(value: string, timezone: string) {
  const date = new Date(value)

  try {
    return new Intl.DateTimeFormat("en", { month: "short", timeZone: timezone }).format(date)
  } catch {
    return new Intl.DateTimeFormat("en", { month: "short" }).format(date)
  }
}

function formatScheduleDay(value: string, timezone: string) {
  const date = new Date(value)

  try {
    return new Intl.DateTimeFormat("en", { day: "numeric", timeZone: timezone }).format(date)
  } catch {
    return new Intl.DateTimeFormat("en", { day: "numeric" }).format(date)
  }
}

function RecentRun({ run }: { run: DashboardRun }) {
  const completed = run.status === "completed"
  const failed = run.status === "failed"
  const StatusIcon = completed ? CircleCheck : failed ? XCircle : Clock3
  const statusColor = completed ? "text-emerald-700" : failed ? "text-rose-600" : "text-amber-600"
  const updatedAt = new Date(run.completedAt ?? run.createdAt)
  const time = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(updatedAt)

  return <motion.div variants={dashboardItemVariants} className="flex items-center justify-between gap-4 px-5 py-3.5">
    <div className="flex min-w-0 items-center gap-3"><StatusIcon aria-hidden="true" className={`size-4 shrink-0 ${statusColor}`} /><div className="min-w-0">
      <p className="truncate text-sm font-medium">{run.agentConfig.name || "Agent run"}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{run.agentConfig.objective || "Execution"}</p>
    </div></div>
    <div className="shrink-0 text-right"><p className={`text-xs font-semibold capitalize ${statusColor}`}>{run.status.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-muted-foreground">{time}</p></div>
  </motion.div>
}
