import { inngest } from "@/app/inngest/client";
import { ajAi } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { success } from "zod";

export async function POST(req:NextRequest){
  const {agentId, timezone} = await req.json()
   const user = await currentUser()
   const userEmail = user?.primaryEmailAddress?.emailAddress
  if (user) {
    const decision = await ajAi.protect(req, { userId: user.id })
    if (decision.isDenied()) {
      return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
    }
  }
  if(!agentId || !userEmail){
    return NextResponse.json({success: false, message: "Invalid Request"})
  }
  const now = new Date()
  try {
     const agent = await prisma.agentConfig.findFirst({
      where: {
        agentId: agentId,
        userEmail,
      },
    });
   if(agent?.status?.toLocaleLowerCase() !== "active"){
     return NextResponse.json({success: false, message: "Please Mark the agent as active first"})
   }

   const queuedAgent = await prisma.agentRun.findMany({
    where: {
      agentId: agentId,
      status: "running" 
    }
   })
   if(queuedAgent.length>0){
    return NextResponse.json({success: false, message: "Agent is already running in the background"})
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