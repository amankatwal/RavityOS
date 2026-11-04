import { inngest } from "@/app/inngest/client";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getConnectedMcpToolkits, getPlanEntitlements, getStartOfDayInTimezone } from "@/lib/plan-entitlements";

export async function POST(req:NextRequest){
  const {agentId, timezone} = await req.json()
   const [user, { has }] = await Promise.all([currentUser(), auth()])
   const userEmail = user?.primaryEmailAddress?.emailAddress
  if(!agentId || !userEmail){
    return NextResponse.json({success: false, message: "Invalid Request"}, { status: 401 })
  }
  const plan = getPlanEntitlements(has)
  const dayStart = getStartOfDayInTimezone("UTC")
  const now = new Date()
  try {
     const agent = await prisma.agentConfig.findFirst({
      where: {
        agentId: agentId,
        userEmail,
      },
    });
   if (!agent) {
    return NextResponse.json({ success: false, message: "Agent not found" }, { status: 404 })
   }
   if(agent?.status?.toLocaleLowerCase() !== "active"){
     return NextResponse.json({success: false, message: "Please mark the agent as active first"}, { status: 400 })
   }
   if (plan.maxActiveAgents !== null) {
    const activeAgents = await prisma.agentConfig.findMany({
      where: { userEmail, OR: [{ status: "active" }, { status: null }] },
      orderBy: { createdAt: "asc" },
      select: { agentId: true },
    })
    const activeAgentPosition = activeAgents.findIndex((activeAgent) => activeAgent.agentId === agentId)
    if (activeAgentPosition >= plan.maxActiveAgents) {
      return NextResponse.json({
        success: false,
        message: `Your ${plan.name} plan allows ${plan.maxActiveAgents} active agent${plan.maxActiveAgents === 1 ? "" : "s"}. Pause an agent or upgrade your plan.`,
      }, { status: 403 })
    }
   }

   if (plan.maxMcpTools !== null) {
    const configuredTools = new Set(agent.tools.map((tool) => tool.toLowerCase()))
    const connectedTools = await getConnectedMcpToolkits(userEmail)
    if (configuredTools.size > plan.maxMcpTools || connectedTools.size > plan.maxMcpTools) {
      return NextResponse.json({
        success: false,
        message: `Your ${plan.name} plan allows ${plan.maxMcpTools} MCP tools. Remove extra tools from this agent or disconnect tools you no longer need.`,
      }, { status: 403 })
    }
   }

   const queuedAgent = await prisma.agentRun.findMany({
    where: {
      agentId: agentId,
      status: "running" 
    }
   })
   if(queuedAgent.length>0){
    return NextResponse.json({success: false, message: "Agent is already running in the background"}, { status: 409 })
   }
   const todaysRuns = await prisma.agentRun.count({
    where: {
      userEmail,
      OR: [
        { queuedAt: { gte: dayStart } },
        { startedAt: { gte: dayStart } },
      ],
    },
   })
   if(todaysRuns >= plan.dailyRuns){
    return NextResponse.json({
      success: false,
      message: `You've reached the ${plan.dailyRuns} daily agent run limit on your ${plan.name} plan. Upgrade to run more agents today.`,
    }, { status: 403 })
   }
      const run = await prisma.agentRun.create({
    data: {
         userEmail: user.primaryEmailAddress.emailAddress,
          agentId: agentId,
          scheduledFor: now,
          timezone: timezone,
          status:"queued",
          queuedAt: now
    }
  })

  await inngest.send({
    name: "agent/run.now",
    data: {
      runId: run.agentId,
    }
  })
   return NextResponse.json(
      {
        success: true,
        message: "Agent execution queued successfully",
        data: {
          runId: run.id,
          status: run.status,
        },
      },
      { status: 202 }
    );
  } catch (err) {
     console.error("Failed to trigger agent:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to start agent",
      },
      { status: 500 }
    );
  
  }

}