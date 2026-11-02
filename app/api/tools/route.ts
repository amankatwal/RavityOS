import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req:NextRequest){
    const user = await currentUser()
    if(!user){
        return NextResponse.json({success: false, message: "Session Expired"},{status: 401})
    }
    try {
        const tools = await prisma.tool.findMany({
            where: {
                status: "active"
            }
        })

    } catch (err) {
        
    }
}