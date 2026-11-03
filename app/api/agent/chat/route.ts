import { composioSession } from "@/lib/composioSession";
import { ajAi, ajAiPrompt } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { currentUser } from "@clerk/nextjs/server";
import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"
export const maxDuration =300

export async function POST(req:NextRequest){
    try {
         const {messages, agentId}: {messages: UIMessage[], agentId:string} = await req.json()
      const user = await currentUser()
            if (user) {
            const promptText = messages.at(-1)?.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join(" ")
                .trim() ?? ""
            const decision = promptText
                ? await ajAiPrompt.protect(req, {
                    userId: user.id,
                    detectPromptInjectionMessage: promptText,
                })
                : await ajAi.protect(req, { userId: user.id })
                if (decision.isDenied()) {
                        return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
                }
            }
    const agentConfig = await prisma.agentConfig.findUnique({
        where:{
            agentId: agentId,
        }
    })
    if(!agentConfig || !user?.primaryEmailAddress?.emailAddress){
        return NextResponse.json({success: false, message: "Invalid request"})
    }
    const composioToolkits = agentConfig.tools.filter((slug) => slug.toLowerCase() !== "browserbase")
    const composioTools = composioToolkits.length > 0
        ? await (await composioSession(agentConfig, user.primaryEmailAddress.emailAddress)).tools()
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
    const result = await streamText({
        model: openai("gpt-6-luna"),
         instructions,
          tools,
          stopWhen: stepCountIs(20),
        prompt: await convertToModelMessages(messages), 
    })
    return result.toUIMessageStreamResponse({
        onError: (error) => error instanceof Error ? error.message : "The chat request failed.",
    })
    } catch (err) {
        console.error("Agent chat request failed:", err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "The chat request failed." },
            { status: 500 },
        )
    }
   
}