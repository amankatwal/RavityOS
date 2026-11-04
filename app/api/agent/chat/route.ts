import { composioSession } from "@/lib/composioSession";
import { prisma } from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { getPlanEntitlements } from "@/lib/plan-entitlements";

export const runtime = "nodejs"
export const maxDuration =300

export async function POST(req:NextRequest){
    try {
         const {messages, agentId}: {messages: UIMessage[], agentId:string} = await req.json()
            const [user, { has }] = await Promise.all([currentUser(), auth()])
        const userEmail = user?.primaryEmailAddress?.emailAddress
            if (!userEmail) {
                return NextResponse.json({ error: "Authentication required" }, { status: 401 })
            }
        const plan = getPlanEntitlements(has)
        if (!plan.canChat) {
                return NextResponse.json({ error: "Live agent chat is available on Scale and Enterprise plans." }, { status: 403 })
        }
    const agentConfig = await prisma.agentConfig.findUnique({
        where:{
            agentId: agentId,
        }
    })
    if(!agentConfig || agentConfig.userEmail !== userEmail){
        return NextResponse.json({success: false, message: "Invalid request"}, { status: 404 })
    }
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
    const promptText = lastUserMessage?.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ")
        .trim() ?? ""
    const isSimpleGreeting = /^(hi|hello|hey|howdy|good morning|good afternoon|good evening)[.!?\s]*$/i.test(promptText)
    const composioToolkits = agentConfig.tools.filter((slug) => slug.toLowerCase() !== "browserbase")
    const composioTools = !isSimpleGreeting && composioToolkits.length > 0
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

        ${isSimpleGreeting ? "" : "Use webSearch for general questions that need current or externally verifiable information, and cite its sources."}
        if the user asks to update the configuration of the agent or asks you to schedule then encourage the user to edit the agent configuration for it.
        you only have the access to read via tools not edit if user asks to edit the agent configuration then you should tell the user to run the agent while making sure agent configuration is updated.
        if the user enters a generic prompt then you should not use tools and answer the prompt directly without using any tools.
        `
    const tools = {
        ...composioTools,
        ...(!isSimpleGreeting && { webSearch: openai.tools.webSearch({ externalWebAccess: true }) }),
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