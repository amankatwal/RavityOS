import { createHash } from "node:crypto"
import { Redis } from "@upstash/redis"
import { composio } from "@/lib/composio"

const cacheTtlSeconds = 15
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

function getCacheKey(userEmail: string) {
  const userHash = createHash("sha256").update(userEmail.toLowerCase()).digest("hex")
  return `connected-toolkits:${userHash}`
}

export async function getConnectedToolkits(userEmail: string): Promise<Set<string>> {
  const cacheKey = getCacheKey(userEmail)

  if (redis) {
    try {
      const cachedToolkits = await redis.get<string[]>(cacheKey)
      if (Array.isArray(cachedToolkits)) {
        return new Set(cachedToolkits)
      }
    } catch {
      // Continue with Composio when Redis is unavailable.
    }
  }

  const accounts = await composio.connectedAccounts.list({ userIds: [userEmail] })
  const toolkits = Array.from(new Set(
    accounts.items
      .filter((account) => account.status === "ACTIVE")
      .map((account) => account.toolkit.slug.toLowerCase()),
  ))

  if (redis) {
    try {
      await redis.set(cacheKey, toolkits, { ex: cacheTtlSeconds })
    } catch {
      // The Composio result remains usable when Redis writes fail.
    }
  }

  return new Set(toolkits)
}

export async function invalidateConnectedToolkits(userEmail: string) {
  if (!redis) return

  try {
    await redis.del(getCacheKey(userEmail))
  } catch {
    // The short TTL bounds staleness if cache invalidation fails.
  }
}
