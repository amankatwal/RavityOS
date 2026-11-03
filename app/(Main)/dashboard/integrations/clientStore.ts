import { toast } from "@/components/ui/toast";
import axios from "axios";
import {create} from "zustand";

type tool = {
    id: string,
    connected: string | null,
    connectedTools: any,
    name: string,
    description: string,
    icon: string,
    slug: string,
}
type ToolsStore = {
    tools: tool[];
    toolsLoader: boolean;
    fetchAllTools: ()=> void;
    connectTool: (toolSlug: string)=> void;
    disconnectTool: (connectedAccountId: string, toolName: string)=> void;
}
export const useToolsStore = create<ToolsStore>((set) => ({
    tools: [],
    toolsLoader: false,
    fetchAllTools: async() => {
        set({ toolsLoader: true });
        try {
            const res = await axios.get('/api/tools')
            console.log(res.data.data)
            set({ tools: res.data.data, toolsLoader: false });
        } catch (err) {
            toast.add({
                title: "Bad Request",
                type: "error"
            })
        }finally{
            set({ toolsLoader: false });
        }
    },
    connectTool: async(toolSlug) =>{
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
                title: "Bad Request",
                type: "error"
            })
        }
    },
    disconnectTool: async(connectedAccountId, toolName) =>{
        if(!connectedAccountId || !toolName){
             toast.add({
                title: "Invalid Request",
                type: "error"
            })
            return
        }
        console.log(connectedAccountId, toolName)
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
        } catch (err) {
            toast.add({
                title: "Bad Request",
                type: "error"
            })
        }
    }
}))