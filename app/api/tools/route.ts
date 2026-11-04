import { composio } from "@/lib/composio"
import { ajBasic, ajExpensive } from "@/lib/arcjet"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { getPlanEntitlements, hasMcpToolCapacity, invalidateConnectedMcpToolkits } from "@/lib/plan-entitlements"

export async function GET(req:NextRequest){
    const user = await currentUser()
    if(!user){
        return NextResponse.json({success: false, message: "Session Expired"},{status: 401})
    }
    const decision = await ajBasic.protect(req, { userId: user.id })
    if (decision.isDenied()) {
        return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
    }
    try {
        const tools = await prisma.tool.findMany({
            where: {
                status: "active"
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
            }
        })
  const toolSlug = tools.map((tool)=> tool.slug);

  const accounts = await composio.connectedAccounts.list({
    userIds: [user.primaryEmailAddress?.emailAddress ?? ""],
    toolkitSlugs: toolSlug
  });

  const integrations = tools.map((tool)=>{
    const connectedTools = accounts.items.find((account)=> account.toolkit.slug.toLowerCase() === tool.slug.toLowerCase())
    return {
        ...tool,
        connectedTools,
        connected: connectedTools?.status
    }
  })
  return NextResponse.json({success: true, data: integrations},{status: 200})
    } catch (err) {
            return NextResponse.json({success: false, message: "Internal Server err"},{status: 500})
    }
}

export async function POST(req:NextRequest){
             const user = await currentUser();
             const { has } = await auth()
             const {toolSlug} = await req.json()
             if(!user?.primaryEmailAddress?.emailAddress){
                return NextResponse.json({success: false, message: "Session Expired"},{ status: 401})
            }
            const decision = await ajExpensive.protect(req, { userId: user.id })
            if (decision.isDenied()) {
                return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
            }
            if(!toolSlug){
                return NextResponse.json({success: false, message: "Invalid Request"},{ status: 400})
            }
            try {
                const plan = getPlanEntitlements(has)
                const canConnectTool = await hasMcpToolCapacity(user.primaryEmailAddress.emailAddress, toolSlug, plan.maxMcpTools)
                if (!canConnectTool) {
                    return NextResponse.json({
                        success: false,
                        message: `Your ${plan.name} plan allows ${plan.maxMcpTools} connected MCP tool${plan.maxMcpTools === 1 ? "" : "s"}. Disconnect a tool or upgrade your plan.`,
                    }, { status: 403 })
                }
                const session = await composio.sessions.create(user.primaryEmailAddress.emailAddress, {
                    toolkits: [toolSlug]
                })
                const connectionRequest = await session.authorize(toolSlug)
                await invalidateConnectedMcpToolkits(user.primaryEmailAddress.emailAddress)
                return NextResponse.json({redirectUrl: connectionRequest.redirectUrl, message: `Redirecting to ${toolSlug} for authorization`})
            } catch (err) {
                console.log(err)
                return NextResponse.json({success: false, message: "Internal Server error"},{status: 500})
            }
}

export async function DELETE(req:NextRequest){
    const user = await currentUser();
    if(!user?.primaryEmailAddress?.emailAddress){
        return NextResponse.json({success: false, message: "Session Expired"},{ status: 401})
    }
    const decision = await ajExpensive.protect(req, { userId: user.id })
    if (decision.isDenied()) {
        return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
    }
    let connectedAccountId: string
    let toolName: string
    try {
        const body = await req.json()
        connectedAccountId = body.connectedAccountId
        toolName = body.toolName
    } catch {
            return NextResponse.json({ success: false, message: "Invalid Request" }, { status: 400 })
    }
    if(typeof connectedAccountId !== "string" || !connectedAccountId || typeof toolName !== "string" || !toolName){
        return NextResponse.json({success: false, message: "Invalid Request"},{ status: 400})
    }
    try {
         const accounts = await composio.connectedAccounts.list({
            userIds: [user.primaryEmailAddress.emailAddress],
         })
         const account = accounts.items.find((item) => item.id === connectedAccountId)
         if (!account) {
            return NextResponse.json({ success: false, message: "Connected account not found" }, { status: 404 })
         }
            await composio.connectedAccounts.disable(connectedAccountId)
            await invalidateConnectedMcpToolkits(user.primaryEmailAddress.emailAddress)
            return NextResponse.json({success: true, message: `${toolName} disconnected successfully`})
    } catch (err) {
        console.log(err)
        return NextResponse.json({success: false, message: "Internal Server error"},{status: 500})
    }
}