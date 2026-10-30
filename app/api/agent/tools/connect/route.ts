import { composio } from "@/lib/composio";
import { composioSession } from "@/lib/composioSession";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST (req:NextRequest){
    const {toolSlug, agentId}= await req.json()
    if(!toolSlug || !agentId){
        return NextResponse.json({success: false, message: "Invalid Request"}, {status: 401})
    }
    const user = await currentUser()
    if(!user?.primaryEmailAddress?.emailAddress){
        return NextResponse.json({success: false, message: "Session Expired"},{ status: 401})
    }
    try {
        const agent = await prisma.agentConfig.findFirst({
            where: {
                agentId: agentId
            }
        })
           if(!agent){
            return NextResponse.json({success: false, message: "Invalid Request"}, {status: 401})
           }
        const session = await composioSession(agent, user?.primaryEmailAddress?.emailAddress)
       const connectionRequest= await session.authorize(toolSlug)
       return NextResponse.json({redirectUrl: connectionRequest.redirectUrl})
    } catch (err) {
        console.log(err)
    }
}
export async function DELETE(req:NextRequest){
    const {toolSlug, agentId} = await req.json()
 if(!toolSlug || !agentId){
        return NextResponse.json({success: false, message: "Invalid Request"}, {status: 401})
    }
const user = await currentUser()
 if(!user?.primaryEmailAddress?.emailAddress){
        return NextResponse.json({success: false, message: "Session Expired"},{ status: 401})
    }
    try {
        const agent = await prisma.agentConfig.findFirst({
            where: {
                agentId: agentId
            }
        })
           if(!agent){
            return NextResponse.json({success: false, message: "Invalid Request"}, {status: 401})
           }
           const session = await composioSession(agent, user?.primaryEmailAddress?.emailAddress)
           const toolkits = await session.toolkits()
           const toolKit = toolkits.items.find((item)=> item.slug.toLowerCase() === toolSlug.toLowerCase())
            if(!toolKit?.connection?.connectedAccount?.id){
                return NextResponse.json({success: false, message: "Invalid Request"})
            }
            await composio.connectedAccounts.delete(toolKit?.connection?.connectedAccount?.id)
            return NextResponse.json({success: true, message: `${toolSlug} disconnected`})
    } catch (err) {
        console.log(err)
    }
}