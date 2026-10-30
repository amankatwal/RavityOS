"use client"
import React from 'react'
import { useAgentStore } from '../clientStore'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCheck, Ellipsis, Loader, Pause, Pencil, Play, PlayIcon, PlaySquare, Trash } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
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

export default function MyAgents() {
  const { fetchAllAgents, agents, changeAgentStatus, runAgent, agentrunLoader } = useAgentStore()
  const [openAgentId, setOpenAgentId] = React.useState<string | null>(null)
  const [openDelete, setOpenDelete

  ] = React.useState(false)
  React.useEffect(() => {
    void fetchAllAgents()
  }, [fetchAllAgents])

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-5 py-10'>
        <h1 className='text-2xl font-bold'>My Agents</h1>
        <p className='text-sm font-semibold text-muted-foreground'>Run, Manage and update all the agents that you need</p>
      </div>
      <div className='grid sm:grid-cols-2 grid-cols-1 gap-10'>
        {agents.map((agent) => {
          const response = toAgentConfigResponse(agent)
          const scheduleType = response.config?.schedule.frequency ?? 'once'

          return (
            <Card key={agent.id} className='max-w-md px-5 py-5 relative'>
              <div className='absolute top-3 right-3'>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" className='hover:cursor-pointer' size={"icon-sm"}><Ellipsis /></Button>} />
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Agent actions</DropdownMenuLabel>
                      <DropdownMenuItem>
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
                    <DropdownMenuItem onClick={()=>setOpenDelete(true)} >
                    <Trash /> Delete Agent
                     
                      
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
                 <DeleteDialog agentId={agent.agentId} open={openDelete} onOpenChange={setOpenDelete

                 }/>
              </div>
              <CardHeader className='flex flex-col gap-5'>
                <Image unoptimized width={88} height={88} src={agent.agentImage ?? "https://api.dicebear.com/10.x/gaze/svg?tags=animation&seed=412e72eb-5b6f-4b9b-b5c4-982c7722e1f1"} alt='Avatar' />
                <div className='flex items-center gap-5'>
                  <CardTitle>
                    {agent.name}
                  </CardTitle>
                  {agent.status === "active" ? (
                    <Badge variant={'ghost'} className='bg-green-700/20 text-green-700'><CheckCheck />{agent.status}</Badge>
                  ) : (
                    <Badge variant={'ghost'} className='bg-yellow-500/20 text-yellow-600'>{agent.status ?? 'idle'}</Badge>
                  )}
                </div>
                <CardDescription>
                  {(agent.description ?? '').slice(0, 100)}{(agent.description ?? '').length > 100 ? '...' : ''}
                </CardDescription>
                <CardDescription className='flex gap-5 items-center'>
                  <Calendar className='text-chart-5' />{scheduleType}
                </CardDescription>
              </CardHeader>
              <CardFooter className='grid grid-cols-2 gap-3'>
                {agentrunLoader === agent.agentId ? <Button><Loader className='animate-spin' /> Processing...</Button> : <AnimatedButton className='w-full' onClick={()=>runAgent(agent.agentId)}><Play /> Run Agent</AnimatedButton>}
                
                <AgentChat agentId={agent.agentId} />
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
