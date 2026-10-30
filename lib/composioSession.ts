"use server"
import { Agent } from "@/app/(Main)/dashboard/agents/clientStore";
import { composio } from "./composio";
import { prisma } from "./prisma";

export const composioSession = async(agentConfig:Agent, userEmail: string)=>{
    if(agentConfig.composioSession){
        return composio.sessions.use(agentConfig.composioSession)
    }
    const toolkits = agentConfig.tools.filter((slug) => slug.toLowerCase() !== "browserbase")
    const session = await composio.sessions.create(userEmail,{
        toolkits
    })
   await prisma.agentConfig.update({
    where: {
        agentId: agentConfig.agentId,
    },
    data: {
        composioSession: session.sessionId
    }
   })
   return session
}