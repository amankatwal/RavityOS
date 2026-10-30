import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const email = user.primaryEmailAddress?.emailAddress;

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User email not found",
                },
                { status: 400 }
            );
        }

        const result = await prisma.agentConfig.findMany({
            where: {
                userEmail: email,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/agent/config:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}