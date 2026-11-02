import {create} from "zustand"
import { toast } from '@/components/ui/toast'
import axios from "axios"



export type AgentRun = {
    id: string,
    name: string,
    task: string,
    status: string,
    updatedAt:string,
  output: unknown
}

export type ActivityType = {
    agentRuns: AgentRun[],
    agentRunsError: string|null,
    agentRunsLoader: boolean,
    fetchAgentRuns: ()=>void,
}

  type AgentRunResponse = {
    id: string,
    agentConfig: { name: string | null, objective: string | null },
    status: string,
    completedAt: string | null,
    startedAt: string | null,
    queuedAt: string | null,
    createdAt: string,
    output: unknown,
  }

export const useActivityStore = create<ActivityType>((set)=>({
     agentRuns: [],
     agentRunsError:null,
     agentRunsLoader:false,
     fetchAgentRuns: async()=>{
             set({agentRunsLoader: true, agentRunsError: null})
               try {
                const res = await axios.get(`/api/activity`)
                
                if(res.data.message){
                    set({agentRuns: [], agentRunsError: null})
                    return
                }
               set({agentRunsError: null, agentRuns: res.data.data.map((run: AgentRunResponse)=>({
                id: run.id,
                name: run.agentConfig.name ?? "",
                task: run.agentConfig.objective ?? "",
                status: run.status,
                updatedAt: run.completedAt ?? run.startedAt ?? run.queuedAt ?? run.createdAt,
                output: run.output,
               }))})
               } catch {
                set({agentRunsError: "Unable to load activity. Try again."})
                  toast.add({
                    type:"error",
                    title: "Bad Request"
                  })
               }finally{
                set({agentRunsLoader: false})
               }
     }
}))