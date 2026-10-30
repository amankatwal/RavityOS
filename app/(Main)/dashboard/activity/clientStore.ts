import {create} from "zustand"
import { toast } from '@/components/ui/toast'
import axios from "axios"



export type AgentRun = {
    id: string,
    name: string,
    task: string,
    status: string,
    updatedAt:string,
    output: string
}

export type ActivityType = {
    agentRuns: AgentRun[],
    agentRunsError: string|null,
    agentRunsLoader: boolean,
    fetchAgentRuns: ()=>void,
}

export const useActivityStore = create<ActivityType>((set)=>({
     agentRuns: [],
     agentRunsError:null,
     agentRunsLoader:false,
     fetchAgentRuns: async()=>{
             set({agentRunsLoader: true})
               try {
                const res = await axios.get(`/api/activity`)
                
                if(res.data.message){
                    set({agentRunsError: res.data.message})
                    return
                }
                console.log(res.data.data)
               set({agentRuns: res.data.data.map((run:any)=>({
                id: run.id,
                name: run.agentConfig.name,
                task: run.agentConfig.objective,
                status: run.status,
                updatedAt: run.completedAt ?? run.startedAt ?? run.queuedAt ?? run.createdAt,
               }))})
               } catch (err) {
                  toast.add({
                    type:"error",
                    title: "Bad Request"
                  })
               }finally{
                set({agentRunsLoader: false})
               }
     }
}))