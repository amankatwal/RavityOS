import { composioSession } from "@/lib/composioSession";
import { ajBasic } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest){
    const searchParams = req.nextUrl.searchParams
    const agentId = searchParams.get('agentId')
    if(!agentId){
        return NextResponse.json({success: false, message: "Invalid Request"})
    }
    const user = await currentUser()
    const userEmail = user?.primaryEmailAddress?.emailAddress
    if(!userEmail){
        return NextResponse.json({success:false, message: "Session Expired! Please login Again"})
    }
    const decision = await ajBasic.protect(req, { userId: user.id })
    if (decision.isDenied()) {
        return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
    }
    try {
           const result = await prisma.agentConfig.findFirst({
        where:{
            agentId: agentId,
            userEmail,
        }
    })
    if(result === null){
        return NextResponse.json({success: false, message:"Bad request"})
    }
    const session = await composioSession(result, user?.primaryEmailAddress?.emailAddress)
    const allowdedTools = result.tools
    const toolkitResult = await session.toolkits()
    const tools = allowdedTools.map((slug)=>{
  const toolkit =  toolkitResult.items.find((item)=> item.slug.toLowerCase() === slug.toLowerCase()
    
)
return {slug, logo: toolkit?.logo, name: toolkit?.name, connected:toolkit?.connection?.isActive ?? false}
    })
    return NextResponse.json({data:tools}) 
    } catch {
     return NextResponse.json({success: false, message: "Server error"}, {status:500})   
    }

}