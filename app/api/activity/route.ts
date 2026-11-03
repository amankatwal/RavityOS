import { prisma } from "@/lib/prisma";
import { ajBasic } from "@/lib/arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
    const user = await currentUser()
    if(!user){
        return NextResponse.json({success: false, message:"session expired"}, {status: 401})
    }
    const decision = await ajBasic.protect(req, { userId: user.id })
    if (decision.isDenied()) {
        return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 })
    }
    try {
        const result = await prisma.agentRun.findMany({
            where: {
                userEmail: user?.primaryEmailAddress?.emailAddress
            },
            include:{
agentConfig: true,
            },
            orderBy:{
                createdAt: "desc"
            }
        })
        if(result.length === 0){
            return NextResponse.json({success:true, message: "No agent invoked" }, {status:200})
        }
        return NextResponse.json({success: true, data: result}, {status: 200})
    } catch (err) {
        return NextResponse.json({success: false, message:"Internal Server Error"}, {status: 500})
    }
}