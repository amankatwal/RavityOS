import { auth, clerkClient } from "@clerk/nextjs/server"
import { fromZonedTime } from "date-fns-tz"
import { PLAN_SLUGS } from "@/app/data/plan-slugs"
import { getConnectedToolkits, invalidateConnectedToolkits } from "@/lib/connected-tool-cache"

type ClerkHas = Awaited<ReturnType<typeof auth>>["has"]

export const planEntitlements = [
  {
    slug: PLAN_SLUGS.enterprise,
    name: "Enterprise",
    maxActiveAgents: null,
    dailyRuns: 100,
    maxMcpTools: null,
    canSchedule: true,
    canChat: true,
  },
  {
    slug: PLAN_SLUGS.scale,
    name: "Scale / Growth",
    maxActiveAgents: 10,
    dailyRuns: 25,
    maxMcpTools: 7,
    canSchedule: true,
    canChat: true,
  },
  {
    slug: PLAN_SLUGS.builder,
    name: "Hobby / Pro Builder",
    maxActiveAgents: 3,
    dailyRuns: 5,
    maxMcpTools: 2,
    canSchedule: true,
    canChat: false,
  },
  {
    slug: PLAN_SLUGS.starter,
    name: "Starter / Free",
    maxActiveAgents: 1,
    dailyRuns: 1,
    maxMcpTools: 1,
    canSchedule: false,
    canChat: false,
  },
] as const

export function getPlanEntitlements(has: ClerkHas) {
  return planEntitlements.find(({ slug }) => has({ plan: slug })) ?? planEntitlements.at(-1)!
}

export async function getPlanEntitlementsForEmail(email: string) {
  const starterPlan = planEntitlements.at(-1)!
  try {
    const clerk = await clerkClient()
    const { data: users } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 })
    if (!users[0]) return starterPlan

    const subscription = await clerk.billing.getUserBillingSubscription(users[0].id)
    const activePlan = subscription.subscriptionItems.find((item) => item.status === "active")?.plan
    return planEntitlements.find(({ slug }) => slug === activePlan?.slug) ?? starterPlan
  } catch {
    return starterPlan
  }
}

export function getStartOfDayInTimezone(timezone: string, now = new Date()) {
  try {
    const dateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now)
    const values = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]))
    return fromZonedTime(`${values.year}-${values.month}-${values.day}T00:00:00`, timezone)
  } catch {
    const utcStart = new Date(now)
    utcStart.setUTCHours(0, 0, 0, 0)
    return utcStart
  }
}

export async function hasMcpToolCapacity(userEmail: string, toolSlug: string, limit: number | null) {
  if (limit === null) return true

  const connectedToolkits = await getConnectedMcpToolkits(userEmail)
  return connectedToolkits.has(toolSlug.toLowerCase()) || connectedToolkits.size < limit
}

export async function getConnectedMcpToolkits(userEmail: string) {
  return getConnectedToolkits(userEmail)
}

export async function invalidateConnectedMcpToolkits(userEmail: string) {
  return invalidateConnectedToolkits(userEmail)
}