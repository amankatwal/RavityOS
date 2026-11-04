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
    const userEmail = user.primaryEmailAddress?.emailAddress
    if (!userEmail) {
        return NextResponse.json({ success: false, message: "User email not found" }, { status: 400 })
    }
    const searchParams = req.nextUrl.searchParams
    const cursor = searchParams.get("cursor") || undefined
    const query = searchParams.get("q")?.trim()
    const status = searchParams.get("status")
    const requestedPageSize = Number(searchParams.get("pageSize") ?? 25)
    const pageSize = Number.isFinite(requestedPageSize)
        ? Math.min(Math.max(Math.floor(requestedPageSize), 1), 100)
        : 25
    const where = {
        userEmail,
        ...(status === "active"
            ? { status: { in: ["queued", "running"] } }
            : status && status !== "all"
                ? { status }
                : {}),
        ...(query
            ? {
                agentConfig: {
                    is: {
                        OR: [
                            { name: { contains: query, mode: "insensitive" as const } },
                            { objective: { contains: query, mode: "insensitive" as const } },
                        ],
                    },
                },
            }
            : {}),
    }
    try {
        const [runs, totalCount, totalRuns, completed, active, awaitingInput, failed] = await Promise.all([
            prisma.agentRun.findMany({
                where,
                include: { agentConfig: true },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: pageSize + 1,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            }),
            prisma.agentRun.count({ where }),
            prisma.agentRun.count({ where: { userEmail } }),
            prisma.agentRun.count({ where: { userEmail, status: "completed" } }),
            prisma.agentRun.count({ where: { userEmail, status: { in: ["queued", "running"] } } }),
            prisma.agentRun.count({ where: { userEmail, status: "awaiting_input" } }),
            prisma.agentRun.count({ where: { userEmail, status: "failed" } }),
        ])
        const hasMore = runs.length > pageSize
        const data = hasMore ? runs.slice(0, pageSize) : runs
        return NextResponse.json({
            success: true,
            data,
            pagination: {
                nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null,
                hasMore,
                totalCount,
            },
            counts: { total: totalRuns, completed, active, awaitingInput, failed },
        }, { status: 200 })
    } catch {
        return NextResponse.json({success: false, message:"Internal Server Error"}, {status: 500})
    }
}