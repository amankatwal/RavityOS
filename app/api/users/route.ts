import { ajBasic } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest){
    const user = await currentUser();
  
    if(!user){
        return NextResponse.json({success: false, message: "User not found", status: 404})
    }
       const decision = await ajBasic.protect(request,{userId:user.id})
       if(decision.isDenied()){
        return NextResponse.json({success: false, message: `Request denied: ${decision.reason}`, status: 403})
       }
    try {
        const userResult = await prisma.user.findUnique({
        where: {
            email: user?.primaryEmailAddress?.emailAddress ?? ''
        }
    })
    if(!userResult && user.primaryEmailAddress?.emailAddress && user.fullName){
        const newUser = await prisma.user.create({
            data: {
                id: uuidv4(),
                name: user?.fullName,
                email: user?.primaryEmailAddress?.emailAddress,
            }
        })
        return NextResponse.json({success: true, message: "User created successfully", status: 201, data: newUser})
    }
    return NextResponse.json({success: true, message: "User already exists", status: 200, data: userResult})
    } catch (err) {
        console.log(err)
        return NextResponse.json({success: false, message: "Error occurred while processing request", status: 500})
    }
    
}