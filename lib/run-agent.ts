import { Agent } from "@/app/(Main)/dashboard/agents/clientStore";
import { composioSession } from "./composioSession";
import { openai } from "@ai-sdk/openai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { z } from "zod";

export const AgentOutputSchema = z.object({
    status: z.enum([
        "completed",
        "awaiting_approval",
        "failed",
    ]),

    message: z.string(),

    result: z.string().nullable(),

    intervention: z.object({
        type: z.enum([
            "approval",
            "assistance",
            "input_required",
        ]),
        action: z.string(),
        toolName: z.string().nullable(),
    }).nullable(),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

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

                Human intervention
                If you need information or a decision from the user before continuing, do not mark the task completed. Return status "awaiting_approval" and provide a non-null intervention with the specific question in action. Use "input_required" for missing information, "approval" for a decision, or "assistance" when user help is needed. Set intervention to null only when no user response is needed.
        
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
            output: Output.object({
                schema: AgentOutputSchema,
            }),
            stopWhen: stepCountIs(10),
        })
        const result = await agent.generate({
            
            prompt: input
        })
        return result.output
    } catch (err) {
console.log(err)
    }
}