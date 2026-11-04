import { prisma } from "@/lib/prisma";
import { ajBasic } from "@/lib/arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

        const decision = await ajBasic.protect(request, { userId: user.id });
        if (decision.isDenied()) {
            return NextResponse.json({ success: false, message: "Request denied" }, { status: 429 });
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

        const searchParams = request.nextUrl.searchParams
        const cursor = searchParams.get("cursor") || undefined
        const requestedPageSize = Number(searchParams.get("pageSize") ?? 12)
        const pageSize = Number.isFinite(requestedPageSize)
            ? Math.min(Math.max(Math.floor(requestedPageSize), 1), 50)
            : 12
        const where = { userEmail: email }
        const [agents, totalCount] = await Promise.all([
            prisma.agentConfig.findMany({
                where,
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: pageSize + 1,
                ...(cursor ? { cursor: { agentId: cursor }, skip: 1 } : {}),
            }),
            prisma.agentConfig.count({ where }),
        ])
        const hasMore = agents.length > pageSize
        const data = hasMore ? agents.slice(0, pageSize) : agents

        return NextResponse.json(
            {
                success: true,
                data,
                pagination: {
                    nextCursor: hasMore ? data[data.length - 1]?.agentId ?? null : null,
                    hasMore,
                    totalCount,
                },
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