import {create} from "zustand"
import { toast } from '@/components/ui/toast'
import axios from "axios"



export type AgentRun = {
    id: string,
    name: string,
    task: string,
    status: string,
    updatedAt:string,
  output: unknown
}

export type ActivityType = {
    agentRuns: AgentRun[],
    agentRunsError: string|null,
    agentRunsLoader: boolean,
  statusFilter: string,
  searchQuery: string,
  currentCursor: string | null,
  cursorStack: Array<string | null>,
  nextCursor: string | null,
  hasMore: boolean,
  totalCount: number,
  counts: { total: number; completed: number; active: number; awaitingInput: number; failed: number },
  fetchAgentRuns: (options?: { cursor?: string | null; cursorStack?: Array<string | null>; status?: string; query?: string }) => Promise<void>,
  setAgentRunFilters: (status: string, query: string) => void,
  nextAgentRuns: () => void,
  previousAgentRuns: () => void,
}

  type AgentRunResponse = {
    id: string,
    agentConfig: { name: string | null, objective: string | null },
    status: string,
    completedAt: string | null,
    startedAt: string | null,
    queuedAt: string | null,
    createdAt: string,
    output: unknown,
  }

export const useActivityStore = create<ActivityType>((set, get) => ({
  agentRuns: [],
  agentRunsError: null,
  agentRunsLoader: false,
  statusFilter: "all",
  searchQuery: "",
  currentCursor: null,
  cursorStack: [],
  nextCursor: null,
  hasMore: false,
  totalCount: 0,
  counts: { total: 0, completed: 0, active: 0, awaitingInput: 0, failed: 0 },
  fetchAgentRuns: async (options = {}) => {
    const cursor = options.cursor !== undefined ? options.cursor : get().currentCursor
    const cursorStack = options.cursorStack ?? get().cursorStack
    const status = options.status ?? get().statusFilter
    const query = options.query ?? get().searchQuery
    set({ agentRunsLoader: true, agentRunsError: null })
    try {
      const params = new URLSearchParams({ pageSize: "25", status })
      if (cursor) params.set("cursor", cursor)
      if (query.trim()) params.set("q", query.trim())
      const response = await axios.get(`/api/activity?${params.toString()}`)
      const pagination = response.data.pagination
      const counts = response.data.counts ?? { total: 0, completed: 0, active: 0, awaitingInput: 0, failed: 0 }
      set({
        agentRunsError: null,
        statusFilter: status,
        searchQuery: query,
        currentCursor: cursor,
        cursorStack,
        nextCursor: pagination?.nextCursor ?? null,
        hasMore: pagination?.hasMore ?? false,
        totalCount: pagination?.totalCount ?? 0,
        counts,
        agentRuns: (response.data.data ?? []).map((run: AgentRunResponse) => ({
          id: run.id,
          name: run.agentConfig.name ?? "",
          task: run.agentConfig.objective ?? "",
          status: run.status,
          updatedAt: run.completedAt ?? run.startedAt ?? run.queuedAt ?? run.createdAt,
          output: run.output,
        })),
      })
    } catch {
      set({ agentRunsError: "Unable to load activity. Try again." })
      toast.add({ type: "error", title: "Bad Request" })
    } finally {
      set({ agentRunsLoader: false })
    }
  },
  setAgentRunFilters: (status, query) => {
    set({ statusFilter: status, searchQuery: query, cursorStack: [], currentCursor: null })
    void get().fetchAgentRuns({ cursor: null, cursorStack: [], status, query })
  },
  nextAgentRuns: () => {
    const state = get()
    if (!state.hasMore || !state.nextCursor || state.agentRunsLoader) return
    void state.fetchAgentRuns({
      cursor: state.nextCursor,
      cursorStack: [...state.cursorStack, state.currentCursor],
    })
  },
  previousAgentRuns: () => {
    const state = get()
    if (!state.cursorStack.length || state.agentRunsLoader) return
    const cursorStack = state.cursorStack.slice(0, -1)
    void state.fetchAgentRuns({
      cursor: state.cursorStack[state.cursorStack.length - 1],
      cursorStack,
    })
  },
}))