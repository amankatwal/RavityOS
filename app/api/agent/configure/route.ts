import { generateText, Output } from "ai";
import { ajAi, ajAiPrompt, ajBasic, ajNetwork } from "@/lib/arcjet";
import {openai} from "@ai-sdk/openai"
import { NextRequest, NextResponse } from "next/server";
import { AgentConfigSystemPrompt } from "@/app/data/AgentConfigSytemPrompt";
import { AgentConfigRespSchema } from "@/app/data/AgentConfigResSchema";
import { prisma } from "@/lib/prisma";
import { getPlanEntitlements } from "@/lib/plan-entitlements";
import { auth, currentUser } from "@clerk/nextjs/server";
import {  z } from "zod";
import { calculateNextDailyRun } from "@/lib/agent-schedule";

export const AgentConfigUpdateSchema = z.object({
  agentId: z.string().min(1),
  name: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  outputFormat: z.string().trim().min(1),
  schedule: z.object({
    type: z.enum(["Manual", "once", "recurring"]),
    time: z.string().min(1),
    frequency: z.string().min(1),
    timezone: z.string().min(1),
  }),
  status: z.enum(["active", "pause"]),
  skills: z.array(z.string().trim().min(1)).min(1),
})
export async function POST(request: NextRequest) {
  const { prompt, timezone } = await request.json();
  const user = await currentUser();
  const { has } = await auth()
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json({ success: false, data: "User not authenticated", status: 401 });
  }

  const decision = typeof prompt === "string" && prompt.trim()
    ? await ajAiPrompt.protect(request, {
        userId: user.id,
        detectPromptInjectionMessage: prompt,
      })
    : await ajAi.protect(request, { userId: user.id })
  if (decision.isDenied()) {
    return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ success: false, data: "Please enter the prompt", status: 400 });
  }

  const plan = getPlanEntitlements(has)
  try {
    const activeAgentCount = await prisma.agentConfig.count({
      where: {
        userEmail,
        OR: [{ status: "active" }, { status: null }],
      },
    })
    if (plan.maxActiveAgents !== null && activeAgentCount >= plan.maxActiveAgents) {
      return NextResponse.json({
        success: false,
        message: `Your ${plan.name} plan allows ${plan.maxActiveAgents} active agent${plan.maxActiveAgents === 1 ? "" : "s"}. Pause an agent or upgrade your plan.`,
      }, { status: 403 })
    }

    const tools = await prisma.tool.findMany({
      select: {
        slug: true,
      }
    })
    const availableTools = tools.map((tool) => tool.slug).join(", ");
    const result = await generateText({
    model: openai("gpt-6-luna"),
    system: AgentConfigSystemPrompt.replace("{USER_PROMPT}", prompt).replace("{AVAILABLE_TOOLS}", availableTools.toString()),
    prompt,
   output: Output.object({
    schema: AgentConfigRespSchema
   }),
  });
  if(result.output.status === "ready" && result.output.config){
    const selectedTools = [...new Set(result.output.config.tools)]
    if (plan.maxMcpTools !== null && selectedTools.length > plan.maxMcpTools) {
      return NextResponse.json({
        success: false,
        message: `Your ${plan.name} plan allows up to ${plan.maxMcpTools} MCP tool${plan.maxMcpTools === 1 ? "" : "s"} per agent. Remove extra tools or upgrade your plan.`,
      }, { status: 403 })
    }
    if (result.output.config.schedule.type === "recurring" && !plan.canSchedule) {
      return NextResponse.json({
        success: false,
        message: `Scheduled runs require a paid plan. Upgrade to enable scheduling.`,
      }, { status: 403 })
    }

    const latestActiveAgentCount = await prisma.agentConfig.count({
      where: {
        userEmail,
        OR: [{ status: "active" }, { status: null }],
      },
    })
    if (plan.maxActiveAgents !== null && latestActiveAgentCount >= plan.maxActiveAgents) {
      return NextResponse.json({
        success: false,
        message: `Your ${plan.name} plan allows ${plan.maxActiveAgents} active agent${plan.maxActiveAgents === 1 ? "" : "s"}. Pause an agent or upgrade your plan.`,
      }, { status: 403 })
    }

    const agentId = crypto.randomUUID()
const agent= await prisma.agentConfig.create({
      data:{
        ...result.output.config,
        schedule: {
          time: result.output.config?.schedule.time,
          type: result.output.config?.schedule.type,
          frequency: result.output.config?.schedule.frequency,
          timezone: timezone,
        },
        agentId: agentId,
        userEmail,
        agentImage: `https://api.dicebear.com/10.x/gaze/svg?tags=animation&seed=${agentId}`
      }
    })
    if(result.output.config?.schedule.type === "recurring"){
      
      const firstRun = calculateNextDailyRun({time:result.output.config.schedule.time, timezone: timezone })
      await prisma.agentRun.create({
        data:{
          userEmail: user.primaryEmailAddress.emailAddress,
          agentId: agent.agentId,
          scheduledFor: firstRun,
          timezone: timezone,
          status:"scheduled"
        }
      })
    }
    return NextResponse.json({success: true, data: { agentId: agent.agentId, response: result.output }, status:200})
  }

    return NextResponse.json({success: true, data: result.output, status: 200 })
  
  } catch (err) {
    console.log(err)
    return NextResponse.json({success: false, data: [], status: 500 })
  }
  
  
}

export async function GET(request: NextRequest) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json({ success: false, data: "User not authenticated" }, { status: 401 });
  }

  const decision = await ajBasic.protect(request, { userId: user.id })
  if (decision.isDenied()) {
    return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
  }

  const agentId = request.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ success: false, data: "Agent ID is required" }, { status: 400 });
  }

  try {
    const agent = await prisma.agentConfig.findFirst({
      where: { agentId, userEmail },
    });

    if (!agent) {
      return NextResponse.json({ success: false, data: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: agent }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await currentUser();
  const { has } = await auth()
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json({ success: false, data: "User not authenticated" }, { status: 401 });
  }

  const decision = await ajBasic.protect(request, { userId: user.id })
  if (decision.isDenied()) {
    return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
  }

  let payload: z.infer<typeof AgentConfigUpdateSchema>;
  try {
    payload = AgentConfigUpdateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ success: false, data: "Invalid agent update" }, { status: 400 });
  }
  const plan = getPlanEntitlements(has)
  if (payload.schedule.type === "recurring" && !plan.canSchedule) {
    return NextResponse.json({
      success: false,
      data: "Scheduled runs require a paid plan. Upgrade to enable scheduling.",
    }, { status: 403 })
  }

  try {
    const existingAgent = await prisma.agentConfig.findFirst({
      where: { agentId: payload.agentId, userEmail },
      select: { agentId: true, status: true },
    });

    if (!existingAgent) {
      return NextResponse.json({ success: false, data: "Agent not found" }, { status: 404 });
    }

    if (payload.status === "active" && existingAgent.status !== "active" && plan.maxActiveAgents !== null) {
      const activeAgentCount = await prisma.agentConfig.count({
        where: {
          userEmail,
          agentId: { not: payload.agentId },
          OR: [{ status: "active" }, { status: null }],
        },
      })
      if (activeAgentCount >= plan.maxActiveAgents) {
        return NextResponse.json({
          success: false,
          data: `Your ${plan.name} plan allows ${plan.maxActiveAgents} active agent${plan.maxActiveAgents === 1 ? "" : "s"}. Pause an agent or upgrade your plan.`,
        }, { status: 403 })
      }
    }

    const { agentId,...data } = payload;

    const updatedAgent = await prisma.agentConfig.update({
      where: { agentId },
      data,
    });
    await prisma.agentRun.deleteMany({
      where:{
        agentId: agentId,
        status: "scheduled"
      }
    });
if(data.schedule.type === "recurring" && data.status === "active"){
  const firstRun = calculateNextDailyRun({time:data.schedule.time, timezone: data.schedule.timezone })
    await prisma.agentRun.create({
        data:{
          userEmail: user.primaryEmailAddress.emailAddress,
          agentId: agentId,
          scheduledFor: firstRun,
          timezone: data.schedule.timezone,
          status:"scheduled"
        }
      })
      }
    return NextResponse.json({ success: true, data: updatedAgent }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, data: "Unable to update agent" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest){
  const decision = await ajNetwork.protect(req)
  if (decision.isDenied()) {
    return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
  }
  const {agentId} = await req.json()
  if(!agentId){
    return NextResponse.json({success: false, message: "Invalid Request"})
  }
  try {
    await prisma.agentRun.deleteMany({
      where:{
        agentId: agentId
      }
    })
    await prisma.agentConfig.delete({
      where:{
        agentId: agentId
      }
    })
    return NextResponse.json({success:true, message:'Agent Deleted Successfully'})
  } catch (err) {
   console.log(err)
  }
}