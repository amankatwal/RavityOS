"use client"
import React from 'react'
import { useAgentStore } from '../clientStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CalendarDays, CheckCheck, Ellipsis, Loader, Pause, Pencil, Play, PlaySquare, Trash, Wrench } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AgentEditSheet } from './AgentEditSheet'
import type { AgentConfigType } from '@/app/data/AgentConfigResSchema'
import { AgentChat } from './AgentChat'
import { DeleteDialog } from './DeleteDialog'

const toAgentConfigResponse = (agent: ReturnType<typeof useAgentStore.getState>['agents'][number]): AgentConfigType => {
  const schedule = (agent.schedule && typeof agent.schedule === 'object' ? agent.schedule : {}) as Record<string, unknown>
  const normalizeStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string')
  }

  return {
    status: 'ready',
    clarificationQuestions: [],
    config: {
      name: agent.name ?? '',
      description: agent.description ?? '',
      instructions: agent.instructions ?? '',
      objective: agent.objective ?? '',
      tools: normalizeStringArray(agent.tools),
      skills: normalizeStringArray(agent.skills),
      schedule: {
        type: typeof schedule.type === 'string' && (schedule.type === 'once' || schedule.type === 'recurring') ? schedule.type : 'once',
        frequency: typeof schedule.frequency === 'string' && schedule.frequency.trim() ? schedule.frequency : 'Daily',
        time: typeof schedule.time === 'string' && schedule.time.trim() ? schedule.time : '08:00',
      },
      outputFormat: agent.outputFormat ?? 'Plain text',
    },
  }
}

type PlanUsage = {
  plan: { name: string }
  limits: { activeAgents: number | null; dailyRuns: number; mcpTools: number | null; canChat: boolean }
  usage: { activeAgents: number; dailyRuns: number; mcpTools: number }
}

export default function MyAgents() {
  const {
    fetchAllAgents,
    nextAgentsPage,
    previousAgentsPage,
    agents,
    agentsLoader,
    agentsCurrentCursor,
    agentsCursorStack,
    agentsHasMore,
    agentsTotalCount,
    changeAgentStatus,
    runAgent,
    agentrunLoader,
  } = useAgentStore()
  const [openAgentId, setOpenAgentId] = React.useState<string | null>(null)
  const [openDeleteAgentId, setOpenDeleteAgentId] = React.useState<string | null>(null)
  const [planUsage, setPlanUsage] = React.useState<PlanUsage | null>(null)
  React.useEffect(() => {
    void fetchAllAgents()
    const controller = new AbortController()
    void fetch('/api/entitlements', { signal: controller.signal })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) setPlanUsage(result.data)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [fetchAllAgents])
  const dailyRunLimitReached = planUsage !== null && planUsage.usage.dailyRuns >= planUsage.limits.dailyRuns

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-wrap items-end justify-between gap-4 py-10'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-bold'>My Agents</h1>
          <p className='text-sm text-muted-foreground'>Run, manage, and update your agents.</p>
          {planUsage && <p className='text-xs text-muted-foreground'>
            {planUsage.plan.name} · {planUsage.usage.activeAgents}/{planUsage.limits.activeAgents ?? 'Unlimited'} active agents · {planUsage.usage.dailyRuns}/{planUsage.limits.dailyRuns} runs today (UTC) · {planUsage.usage.mcpTools}/{planUsage.limits.mcpTools ?? 'Unlimited'} connected tools
          </p>}
        </div>
        {!agentsLoader && agentsTotalCount > 0 && (
          <Badge variant='outline' className='px-3 py-1 text-xs'>
            {agentsTotalCount} {agentsTotalCount === 1 ? 'agent' : 'agents'}
          </Badge>
        )}
      </div>
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {agentsLoader && agents.length === 0 && Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className='rounded-md p-5'>
            <div className='flex items-center gap-4'>
              <Skeleton className='size-14 rounded-md' />
              <div className='flex flex-1 flex-col gap-2'>
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-3 w-1/3' />
              </div>
            </div>
            <Skeleton className='mt-5 h-10 w-full' />
            <Skeleton className='mt-5 h-9 w-full' />
          </Card>
        ))}
        {!agentsLoader && agents.length === 0 && (
          <div className='col-span-full rounded-md border border-dashed p-10 text-center'>
            <h2 className='font-semibold'>No agents yet</h2>
            <p className='mt-2 text-sm text-muted-foreground'>Create an agent to see it here.</p>
          </div>
        )}
        {agents.map((agent) => {
          const response = toAgentConfigResponse(agent)
          const schedule = response.config?.schedule
          const scheduleLabel = schedule?.type === 'recurring'
            ? schedule.frequency
            : schedule?.type === 'once' ? 'One-time' : 'Manual'
          const isRunning = agentrunLoader === agent.agentId
          const tools = (agent.tools ?? []).filter((tool): tool is string => typeof tool === 'string')

          return (
            <Card key={agent.id} className='rounded-md border border-border/70 p-0 transition-colors hover:border-primary/40'>
              <CardHeader className='gap-4 p-5'>
                <div className='flex min-w-0 items-start justify-between gap-3'>
                  <div className='flex min-w-0 items-center gap-3'>
                    <Image
                      unoptimized
                      width={56}
                      height={56}
                      className='size-14 shrink-0 rounded-md bg-muted object-cover'
                      src={agent.agentImage ?? 'https://api.dicebear.com/10.x/gaze/svg?tags=animation&seed=412e72eb-5b6f-4b9b-b5c4-982c7722e1f1'}
                      alt=''
                    />
                    <div className='min-w-0'>
                      <CardTitle className='truncate text-base'>{agent.name || 'Untitled agent'}</CardTitle>
                      <div className='mt-1'>
                        {agent.status === 'active' ? (
                          <Badge variant='ghost' className='bg-green-700/10 text-green-700'>
                            <CheckCheck /> Active
                          </Badge>
                        ) : (
                          <Badge variant='ghost' className='bg-yellow-500/15 text-yellow-700'>
                            {agent.status ?? 'Idle'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant='outline' className='shrink-0' size='icon-sm' aria-label={`Actions for ${agent.name ?? 'agent'}`}><Ellipsis /></Button>} />
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Agent actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => runAgent(agent.agentId)} disabled={isRunning || dailyRunLimitReached}>
                        <Play /> Run Now
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={()=>changeAgentStatus(agent, agent.status === "active" ? "pause" : "active")}>
                      {agent.status === "active" ? <Pause /> : <PlaySquare />}   {agent.status === "active" ? "Pause" : "Active"} Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.preventDefault()
                          setOpenAgentId(agent.agentId)
                        }}
                      >
                        <Pencil /> Edit Agent
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpenDeleteAgentId(agent.agentId)}>
                      <Trash /> Delete Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
                <CardDescription className='line-clamp-2 min-h-10'>
                  {agent.description || 'No description provided.'}
                </CardDescription>
                <AgentEditSheet
                  agentId={agent.agentId}
                  response={response}
                  onSave={() => { void fetchAllAgents() }}
                  open={openAgentId === agent.agentId}
                  onOpenChange={(nextOpen) => setOpenAgentId(nextOpen ? agent.agentId : null)}
                  trigger={
                    <Button variant="outline" size="sm" className="hidden">
                      <Pencil /> Edit Agent
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent className='flex flex-col gap-4 px-5 pb-5'>
                <div className='grid grid-cols-2 gap-3 border-y py-3'>
                  <div className='flex min-w-0 items-center gap-2'>
                    <CalendarDays className='size-4 shrink-0 text-muted-foreground' />
                    <span className='truncate text-sm'>{scheduleLabel}</span>
                  </div>
                  <div className='flex min-w-0 items-center gap-2'>
                    <Wrench className='size-4 shrink-0 text-muted-foreground' />
                    <span className='truncate text-sm'>{tools.length} {tools.length === 1 ? 'tool' : 'tools'}</span>
                  </div>
                </div>
                {tools.length > 0 && (
                  <div className='flex min-h-6 flex-wrap gap-1.5'>
                    {tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant='outline' className='max-w-full truncate text-xs font-normal'>
                        {tool.replaceAll('_', ' ')}
                      </Badge>
                    ))}
                    {tools.length > 3 && <span className='self-center text-xs text-muted-foreground'>+{tools.length - 3}</span>}
                  </div>
                )}
                <DeleteDialog
                  agentId={agent.agentId}
                  open={openDeleteAgentId === agent.agentId}
                  onOpenChange={(nextOpen) => setOpenDeleteAgentId(nextOpen ? agent.agentId : null)}
                />
              </CardContent>
              <CardFooter className='grid grid-cols-1 gap-2 border-t px-5 py-4 sm:grid-cols-2'>
                {isRunning ? (
                  <Button className='w-full' disabled><Loader className='animate-spin' /> Processing...</Button>
                ) : (
                  <AnimatedButton className='w-full' disabled={dailyRunLimitReached} onClick={() => runAgent(agent.agentId)}><Play /> {dailyRunLimitReached ? 'Daily limit reached' : 'Run Agent'}</AnimatedButton>
                )}
                {planUsage?.limits.canChat ? <AgentChat agentId={agent.agentId} /> : (
                  <p className='flex min-h-9 items-center justify-center border border-border px-3 text-center text-xs text-muted-foreground'>Live chat is available on Scale and Enterprise.</p>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
      {agentsTotalCount > 0 && <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground'>
        <span>
          {agentsCursorStack.length * 12 + 1}–{Math.min(agentsCursorStack.length * 12 + agents.length, agentsTotalCount)} of {agentsTotalCount} agents
        </span>
        <div className='flex items-center gap-2'>
          <Button type='button' variant='outline' size='sm' disabled={!agentsCurrentCursor || agentsLoader} onClick={previousAgentsPage} aria-label='Previous agents page'>
            <ArrowLeft aria-hidden='true' className='size-3.5' /> Previous
          </Button>
          <Button type='button' variant='outline' size='sm' disabled={!agentsHasMore || agentsLoader} onClick={nextAgentsPage} aria-label='Next agents page'>
            Next <ArrowRight aria-hidden='true' className='size-3.5' />
          </Button>
        </div>
      </div>}
    </div>
  )
}
