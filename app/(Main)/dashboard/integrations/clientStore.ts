import { toast } from "@/components/ui/toast";
import axios from "axios";
import {create} from "zustand";

type tool = {
    id: string,
    connected: string | null,
    connectedTools: { id: string } | null,
    name: string,
    description: string,
    icon: string,
    slug: string,
}
type ToolsStore = {
    tools: tool[];
    toolsLoader: boolean;
    connectionLoader: string | null;
    fetchAllTools: ()=> void;
    connectTool: (toolSlug: string)=> void;
    disconnectTool: (connectedAccountId: string, toolName: string, toolSlug: string)=> void;
}
export const useToolsStore = create<ToolsStore>((set) => ({
    connectionLoader: null,
    tools: [],
    toolsLoader: false,
    fetchAllTools: async() => {
        set({ toolsLoader: true });
        try {
            const res = await axios.get('/api/tools')
            console.log(res.data.data)
            set({ tools: res.data.data, toolsLoader: false });
        } catch {
            toast.add({
                title: "Unable to load integrations",
                type: "error"
            })
        }finally{
            set({ toolsLoader: false });
        }
    },
    connectTool: async(toolSlug) =>{
         set({connectionLoader: toolSlug})
        if(!toolSlug){
            return toast.add({
                title: "Invalid Request",
                type: "error"
            })
        }
        try {
           const res = await axios.post('/api/tools', {toolSlug})
           if(res.data.redirectUrl){
            window.open(res.data.redirectUrl)
           } 
        } catch (err) {
            toast.add({
                title: axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message ?? "Unable to connect tool" : "Unable to connect tool",
                type: "error"
            })
        }finally{
            set({connectionLoader: null})
        }
    },
    disconnectTool: async(connectedAccountId, toolName, toolSlug) =>{
        set({connectionLoader: toolSlug})
        if(!connectedAccountId || !toolName){
             toast.add({
                title: "Invalid Request",
                type: "error"
            })
            return
        }
        try {
          const res = await axios.delete('/api/tools', {data:{connectedAccountId, toolName}})  
          if(res.data.success){ 
            toast.add({
                type: "success",
                title: res.data.message
            })
            set((state)=>({
                tools: state.tools.map((tool)=>{
                    if(tool.name === toolName){
                        return {...tool, connected: null, connectedTools: null}
                    }
                    return tool
                })
            }))
          }
        } catch {
            toast.add({
                title: "Bad Request",
                type: "error"
            })
        }finally{
            set({connectionLoader: null})
        }
    }
}))