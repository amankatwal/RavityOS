"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { BadgeCheckIcon, Ellipsis, Loader2, Pause, Play, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { AgentConfigRespSchema, type AgentConfigType } from '@/app/data/AgentConfigResSchema'
import Image from 'next/image'
import { AgentEditSheet } from "./AgentEditSheet"
import { useAgentStore } from "../clientStore"

export type CreatedAgentProps = {
  agentId: string
}

type SavedAgent = {
  response: AgentConfigType
  agentImage: string | null
}

export default function CreatedAgent({ agentId }: CreatedAgentProps) {
  const [agent, setAgent] = useState<SavedAgent | null>(null)
  const [loadError, setLoadError] = useState(false)
  const {agentDeleteLoader, deleteAgent} = useAgentStore()
  useEffect(() => {
    const controller = new AbortController()

    async function loadAgent() {
      try {
        const result = await axios.get('/api/agent/configure', {
          params: { agentId },
          signal: controller.signal,
        })
        const savedAgent = result.data.data
        const response = AgentConfigRespSchema.parse({
          status: 'ready',
          clarificationQuestions: [],
          config: savedAgent,
        })

        setAgent({
          response,
          agentImage: typeof savedAgent.agentImage === 'string' ? savedAgent.agentImage : null,
        })
      } catch {
        if (!controller.signal.aborted) setLoadError(true)
      }
    }

    void loadAgent()
    return () => controller.abort()
  }, [agentId])

  if (loadError) {
    return <p role="alert" className="text-sm text-destructive">Unable to load the saved agent.</p>
  }

  if (!agent) {
    return <Loader2 className="mx-auto size-5 animate-spin" aria-label="Loading saved agent" />
  }

  const { response } = agent
  const config = response.config

  if (!config) return null

  return (
    <div className="flex justify-center">
     <div className="flex w-full max-w-3xl flex-col gap-6 ">
      <Item variant="outline" className="flex justify-between">
        <div className="flex gap-3 items-ce">
          <Image unoptimized src={agent.agentImage ?? "https://api.dicebear.com/10.x/gaze/svg?tags=animation&seed=Felix"}
  alt="avatar" width={50} height={50} />
        <ItemContent>
          <ItemTitle>{config.name} <span className="bg-green-700/20 text-green-700 px-3 py-1">Ready</span></ItemTitle>
          <ItemDescription>
            {config.description.slice(0,100)}...
          </ItemDescription>
        </ItemContent></div>
        <ItemActions className="flex justify-center items-center">
          <AgentEditSheet agentId={agentId} response={response}/>
          <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className='hover:cursor-pointer' size={"icon-sm"}><Ellipsis /></Button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <Play />  Run Now
            
          </DropdownMenuItem>
          <DropdownMenuItem>
           <Pause /> Pause Agent
          </DropdownMenuItem>
          <DropdownMenuItem>
           <Pencil /> Edit Agent
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onMouseDown={()=> deleteAgent(agentId)}>
           <Trash /> Delete Agent
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm" render={<a href="#"><ItemMedia>
          <BadgeCheckIcon className="size-5" />
        </ItemMedia><ItemContent>
          <ItemTitle>Your new Agent Have been created</ItemTitle>
        </ItemContent><ItemActions>
        </ItemActions></a>} />
    </div></div>
  )
}