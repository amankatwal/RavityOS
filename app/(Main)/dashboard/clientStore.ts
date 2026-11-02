import axios from "axios"
import { create } from "zustand"

export type DashboardAgent = {
  agentId: string
  name: string | null
  objective: string | null
  status: string | null
  createdAt: string
}

export type DashboardRun = {
  id: string
  agentId: string
  status: string
  scheduledFor: string
  timezone: string
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  output: unknown
  agentConfig: { name: string | null; objective: string | null }
}

type DashboardStore = {
  agents: DashboardAgent[]
  runs: DashboardRun[]
  loading: boolean
  error: string | null
  fetchDashboardData: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  agents: [],
  runs: [],
  loading: false,
  error: null,
  fetchDashboardData: async () => {
    set({ loading: true, error: null })

    try {
      const [agentsResponse, runsResponse] = await Promise.all([
        axios.get("/api/agents"),
        axios.get("/api/activity"),
      ])

      if (!agentsResponse.data.success || !runsResponse.data.success) {
        throw new Error("Unable to load dashboard analytics")
      }

      set({
        agents: agentsResponse.data.data ?? [],
        runs: runsResponse.data.data ?? [],
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to load dashboard analytics",
      })
    } finally {
      set({ loading: false })
    }
  },
}))