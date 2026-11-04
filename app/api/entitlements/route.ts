import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getConnectedMcpToolkits, getPlanEntitlements, getStartOfDayInTimezone } from "@/lib/plan-entitlements"

export async function GET() {
  const [user, { has }] = await Promise.all([currentUser(), auth()])
  const email = user?.primaryEmailAddress?.emailAddress
  if (!user || !email) {
    return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
  }

  const plan = getPlanEntitlements(has)
  const dayStart = getStartOfDayInTimezone("UTC")

  try {
    const [activeAgents, dailyRuns, connectedToolkits] = await Promise.all([
      prisma.agentConfig.count({
        where: {
          userEmail: email,
          OR: [{ status: "active" }, { status: null }],
        },
      }),
      prisma.agentRun.count({
        where: {
          userEmail: email,
          OR: [
            { queuedAt: { gte: dayStart } },
            { startedAt: { gte: dayStart } },
          ],
        },
      }),
      getConnectedMcpToolkits(email),
    ])

    return NextResponse.json({
      success: true,
      data: {
        plan: { slug: plan.slug, name: plan.name },
        limits: {
          activeAgents: plan.maxActiveAgents,
          dailyRuns: plan.dailyRuns,
          mcpTools: plan.maxMcpTools,
          canSchedule: plan.canSchedule,
          canChat: plan.canChat,
        },
        usage: {
          activeAgents,
          dailyRuns,
          mcpTools: connectedToolkits.size,
        },
      },
    })
  } catch (error) {
    console.error("GET /api/entitlements failed:", error)
    return NextResponse.json({ success: false, message: "Unable to load plan limits" }, { status: 500 })
  }
}