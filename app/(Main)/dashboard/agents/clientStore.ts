import axios from 'axios'
import {create} from 'zustand'
import { AgentConfigRespSchema, type AgentConfigType } from '@/app/data/AgentConfigResSchema'
import { toast } from '@/components/ui/toast'
import { JsonValue } from '@prisma/client/runtime/client'

export type AgentConfigUpdate = {
  name: string
  objective: string
  instructions: string
  outputFormat: string
  schedule: {
    type: "Manual" | "once" | "recurring"
    time: string
    frequency: "Hourly" | "Daily" | "Weekly" | "Monthly"
    timezone: string
  }
  skills: string[]
  status: "active" | "pause"
}

export type Agent = {
  id: number;
    name: string | null;
    description: string | null;
    instructions: string | null;
    objective: string | null;
    tools: string[];
    skills: string[];
    schedule: JsonValue | null;
    outputFormat: string | null;
    agentId: string;
    userEmail: string;
    agentImage: string | null;
    status: string | null;
    composioSession: string | null
    createdAt: Date;
}
export type AgentTool ={
  slug: string;
    logo: string | undefined;
    name: string | undefined;
    connected: boolean;
}
type AgentStore = {
    userPrompt: string,
    submitPrompt:(prompt:string)=> Promise<void>,
    agentConfigResponse: AgentConfigType | null,
    createdAgentId: string | null,
    agentTools: AgentTool[],
    agentConfigLoader: boolean,
    agentUpdateLoader: boolean,
    agentsLoader: boolean,
    agentToolLoader:boolean,
    agentDeleteLoader:boolean,
    agentrunLoader: string | null,
    connectionLoader: string | null,
    agents : Agent[],
    savedAgent: Agent | null,
    updateAgentConfig: (agentId: string, values: AgentConfigUpdate) => Promise<boolean>,
    fetchAllAgents: ()=> Promise<void>
    fetchAgentByID: (agentId: string) => Promise<void>,
    getComposio: (agentId:string) => void,
    connectionRequest : (toolSlug:string, agentId:string)=>void,
    connectionBreak: (toolSlug:string, agentId: string) => void, 
    deleteAgent: (agent:string)=> void,
    changeAgentStatus: (agentConfig:Agent, status:string)=> void,
    runAgent:(agentId: string) => void,
}

export const useAgentStore = create<AgentStore>((set)=>({
userPrompt:"",
agentConfigResponse: null,
createdAgentId: null,
agentConfigLoader: false,
agentUpdateLoader: false,
agentsLoader: false,
agentToolLoader: false,
agentrunLoader: null,
agentDeleteLoader: false,
connectionLoader: null,
agents: [],
agentTools: [],
savedAgent: null,
updateAgentConfig: async (agentId, values) => {
  set({ agentUpdateLoader: true })
  try {
    const result = await axios.put('/api/agent/configure', { agentId,...values})
    
    if (!result.data.success) return false
     toast.add({
      type: "success",
      title: "Agent configuration updated successfully"
     })
    return true
  } catch (error) {
    console.error(error)
    return false
  } finally {
    set({ agentUpdateLoader: false })
  }
},
submitPrompt:async (prompt)=>{
    set({userPrompt:prompt, agentConfigLoader:true, createdAgentId:null})
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const res = await axios.post('/api/agent/configure',{prompt, timezone})
    if(res.status === 200 && res.data.success){
      const response = res.data.data.response ?? res.data.data
      set({
        agentConfigResponse: AgentConfigRespSchema.parse(response),
        createdAgentId: res.data.data.agentId ?? null,
      })
    }
      } catch (error) {
        console.log(error)
      }finally{
        set({agentConfigLoader: false})
      }
    
},

fetchAllAgents: async()=>{
  set({agentsLoader: true})
  try {
    const res = await axios.get(`/api/agents`)
    if(!res.data.success){
     toast.add({
      type: "error",
      title: res.data.message ?? "Failed to fetch agents"
     })
     return
    }
    set({ agents: res.data.data ?? [] })
  } catch (err) {
    console.error(err)
    toast.add({
      type: "error",
      title: "Failed to fetch agents"
    })
  } finally {
    set({agentsLoader: false})
  }
},

fetchAgentByID: async (agentId) => {
  set({ savedAgent: null })
  try {
    const res = await axios.get('/api/agent/configure', { params: { agentId } })
    if (!res.data.success) {
      toast.add({
        type: "error",
        title: res.data.data ?? "Failed to fetch agent",
      })
      return
    }
    set({ savedAgent: res.data.data ?? null })
  } catch (error) {
    console.error(error)
    toast.add({
      type: "error",
      title: "Failed to fetch agent",
    })
  }
},

getComposio : async(agentId)=> {
  set({agentToolLoader: true})
  try {
    const result = await axios.get('/api/agent/tools', { params: { agentId } })
   set({agentTools: result.data.data})
  } catch (err) {
    console.log(err)
  }finally{
 set({agentToolLoader: false})
  }
  
},
connectionRequest : async(toolSlug, agentId)=>{
  set({connectionLoader: toolSlug})
  try {
     const res = await axios.post('/api/agent/tools/connect',{toolSlug, agentId})
  window.open(res.data.redirectUrl)
  toast.add({
    type: "success",
    title: `Redirecting to ${toolSlug}`
  })
  set({agentTools: []})
  } catch {
  toast.add({
    type:"error",
    title: "Invalid Request"
  })
  }finally{
    set({connectionLoader: null})
  }
 
},
connectionBreak : async(toolSlug, agentId) => {
  set({connectionLoader: toolSlug})
  try {
    const result = await axios.delete('/api/agent/tools/connect', {
    data: { toolSlug, agentId }
  })
  if(result.data.success){
toast.add({
  type: "success",
    title: result.data.message
  })
  set({agentTools: []})
  }
  
  } catch {
    toast.add({
    title: "Invalid Request"
  })
  }finally{
set({connectionLoader: null})
  }
},

deleteAgent: async(agentId)=>{
  if(!agentId){
    toast.add({
      type: "error",
      title: "Invalid Request"
    })
    return
  }
 const res = await axios.delete('/api/agent/configure',{data:{agentId}})
 if(!res.data.success){
  toast.add({
    type:"error",
    title: res.data.message
  })
  return
 }
  set((state) => ({
    agents: state.agents.filter(
      (agent) => agent.agentId !== agentId
    ),
  }))
 toast.add({
    type:"success",
    title: res.data.message
  })
},

changeAgentStatus: async(agentConfig, status) =>{
  if(!agentConfig || !status){
    toast.add({
      type:"error",
      title: "Invalid Request"
    })
  }
 
const res = await axios.put("/api/agent/configure", {...agentConfig, status})
if(res.data.success){
toast.add({
  type:"success",
  title: `Agent status updated to ${res.data.data.status}` 
})
set((state)=>({
  agents: state.agents.map((agent)=> agent.id === agentConfig.id ? {...agent, status: res.data.data.status} : agent)
}))
return
}
toast.add({
  type:"error",
  title: "internal server error"
})
},
runAgent: async(agentId)=>{
  set({agentrunLoader: agentId})
  try {
    if(!agentId){
      toast.add({
        type:"error",
        title: "Invalid Request"
      })
      return 
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const res = await axios.post("/api/agent/run",{agentId,timezone})
    if(!res.data.success){
      toast.add({
        type:"error",
        title: res.data.message
      })
      return
    }
toast.add({
        type:"success",
        title: "Agent Invoked successfully"
      })
  } catch (err) {
    toast.add({
        type:"error",
        title: "Bad Request"
      })
  }finally{set({agentrunLoader: null})}
}

}))