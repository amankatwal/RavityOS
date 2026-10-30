import { Agent } from "@/app/(Main)/dashboard/agents/clientStore";
import { composioSession } from "./composioSession";
import { openai } from "@ai-sdk/openai";
import { stepCountIs, ToolLoopAgent } from "ai";

export const runAgent = async ({agentConfig,userEmail, input}:{agentConfig: Agent, userEmail: string, input: string}) => {
    try {
        const composioToolkits = agentConfig.tools.filter((slug) => slug.toLowerCase() !== "browserbase")
        const composioTools = composioToolkits.length > 0
            ? await (await composioSession(agentConfig, userEmail)).tools()
            : {}
        const instructions = `
                 Agent Name
                ${agentConfig.name}
                Instructions
                ${agentConfig.instructions}
                Primary Objective
                ${agentConfig.objective}
                Role
                ${agentConfig.description}
                Output Format
                ${agentConfig.outputFormat}
                Skills
                ${(agentConfig.skills ?? [].join(','))}
        
                Use webSearch for general questions that need current or externally verifiable information, and cite its sources.
                `
        const tools = {
            ...composioTools,
            webSearch: openai.tools.webSearch({ externalWebAccess: true }),
        }
        const agent = new ToolLoopAgent({
            model: openai("gpt-6-luna"),
            instructions,
            tools,
            stopWhen: stepCountIs(10),
        })
        const result = await agent.generate({
            prompt: input
        })
        return result.text
    } catch (err) {
console.log(err)
    }
}