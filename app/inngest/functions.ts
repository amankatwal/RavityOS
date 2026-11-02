import { prisma } from "@/lib/prisma";
import { calculateNextDailyRun } from "@/lib/agent-schedule";
import { inngest } from "./client";
import { AgentConfig } from "../generated/prisma/client";
import { Agent } from "../(Main)/dashboard/agents/clientStore";
import { runAgent } from "@/lib/run-agent";

const toExecutableAgentConfig = (
    agentConfig: Omit<AgentConfig, "createdAt"> & { createdAt: Date | string },
    userEmail: string,
): Agent => ({
    id: agentConfig.id,
    userEmail: agentConfig.userEmail ?? userEmail,
    agentId: agentConfig.agentId,
    name: agentConfig.name ?? "",
    agentImage: agentConfig.agentImage ?? "",
    description: agentConfig.description ?? "",
    instructions: agentConfig.instructions ?? "",
    objective: agentConfig.objective ?? "",
    tools: agentConfig.tools,
    skills: Array.isArray(agentConfig.skills)
        ? (agentConfig.skills as string[])
        : [],
    schedule: (agentConfig.schedule ?? {
        type: "manual",
    }) as AgentConfig["schedule"],
    outputFormat: agentConfig.outputFormat ?? "",
    status: agentConfig.status ?? "active",
    createdAt: new Date(agentConfig.createdAt),
    composioSession: agentConfig.composioSession ?? null,
});

export const ProcessScheduledAgent = inngest.createFunction(
    {
        id: "process-scheduled-agents",

        triggers: [{ cron: "*/5 * * * *" }, {event: "agent/run.now"}],
    },
    async ({ event, step }) => {
        const now = new Date();

       const { runId } = event.data as { runId: string };
        const dueRuns = await step.run("load-due-agents", async () => {
              if(event.name === "agent/run.now"){
                return await prisma.agentRun.findMany({
                    where: {
                        status: "queued",
                         agentId: runId
                    },
                    include:{
                        agentConfig: true,
                    },
                    take: 1,
                })
              }
                       
            return await prisma.agentRun.findMany({
                where: {
                    status: "scheduled",
                    scheduledFor: {
                        lte: now,
                    },
                },
                include: {
                    agentConfig: true,
                },
                orderBy: {
                    scheduledFor: "asc",
                },
                take: 10,
            });
        });

        const results: Array<{
            runId: string;
            agentId: string;
            status: "skipped" | "completed" | "failed";
            error?: string;
        }> = [];

        for (const run of dueRuns) {
            try {
                const startedRun = await step.run(
                    `run-started-${run.id}`,
                    async () => {
                        const result = await prisma.agentRun.updateMany({
                            where: {
                                id: run.id,
                                status: run.status,
                            },
                            data: {
                                status: "running",
                                queuedAt: now,
                                startedAt: new Date(),
                            },
                        });

                        return result.count > 0;
                    },
                );
                if (!startedRun) {
                    results.push({
                        runId: run.id,
                        agentId: run.agentId,
                        status: "skipped",
                    });

                    continue;
                }
                let output = await step.run(
                    `execute-agent-${run.id}`,
                    async () => {
                        return await runAgent({
                            agentConfig: toExecutableAgentConfig(
                                run.agentConfig,
                                run.userEmail,
                            ),
                            userEmail: run.userEmail,
                            input: run.agentConfig.objective ?? "",
                        });
                    },
                );

                const humanInputs: string[] = [];
                let interaction = 0;
                while (output?.intervention) {
                    const interventionRequest = output.intervention.action || output.message;
                    const interactionId = interaction++;
                    await step.run(
                        `mark-run-awaiting-input-${run.id}-${interactionId}`,
                        async () => {
                            await prisma.agentRun.update({
                                where: { id: run.id },
                                data: {
                                    status: "awaiting_input",
                                    output: JSON.stringify(output),
                                },
                            });
                        },
                    );

                    const humanResponse = await step.waitForEvent(
                        `human-input-${run.id}-${interactionId}`,
                        {
                            event: "agent/input.responded",
                            timeout: "24h",
                            data: { runId: run.id },
                        },
                    );
                    if (!humanResponse?.data.response) {
                        throw new Error("Human input was not provided");
                    }
                    humanInputs.push(humanResponse.data.response);

                    await step.run(
                        `resume-run-${run.id}-${interactionId}`,
                        async () => {
                            await prisma.agentRun.update({
                                where: { id: run.id },
                                data: { status: "running" },
                            });
                        },
                    );
                    output = await step.run(
                        `resume-agent-${run.id}-${interactionId}`,
                        async () =>
                            runAgent({
                                agentConfig: toExecutableAgentConfig(
                                    run.agentConfig,
                                    run.userEmail,
                                ),
                                userEmail: run.userEmail,
                                input: `${run.agentConfig.objective ?? ""}\n\nAgent request:\n${interventionRequest}\n\nHuman input:\n${humanInputs.join("\n")}`,
                            }),
                    );
                }

                await step.run(
                    `run-completed-${run.id}`,
                    async () => {
                        await prisma.agentRun.update({
                            where: {
                                id: run.id,
                            },
                            data: {
                                status: "completed",
                                output: output ?? "",
                                completedAt: new Date(),
                            },
                        });
                    },
                );

                const schedule = run.agentConfig.schedule as {
                    type?: string;
                    frequency?: string;
                    time?: string;
                    timezone?: string;
                } | null;
                if (
                    schedule?.type === "recurring" &&
                    schedule.frequency === "daily" &&
                    schedule.time &&
                    event.name !== "agent/run.now"
                ) {
                    await step.run(
                        `schedule-next-run-${run.id}`,
                        async () => {
                            const timezone =
                                schedule.timezone ?? run.timezone ?? "UTC";

                            const nextRun = calculateNextDailyRun({
                                time: schedule.time!,
                                timezone,
                                after: new Date(run.scheduledFor),
                            });

                            await prisma.agentRun.create({
                                data: {
                                    agentId: run.agentId,
                                    userEmail: run.userEmail,
                                    scheduledFor: nextRun,
                                    timezone,
                                    status: "scheduled",
                                },
                            });
                        },
                    );
                }
                results.push({
                    runId: run.id,
                    agentId: run.agentId,
                    status: "completed",
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Unknown error";

                await step.run(
                    `mark-run-failed-${run.id}`,
                    async () => {
                        await prisma.agentRun.updateMany({
                            where: {
                                id: run.id,
                                status: { in: ["running", "awaiting_input"] },
                            },
                            data: {
                                status: "failed",
                                error: message,
                                completedAt: new Date(),
                            },
                        });
                    },
                );
                results.push({
                    runId: run.id,
                    agentId: run.agentId,
                    status: "failed",
                    error: message,
                });
            }
        }
        return {
            processed: results.length,
            results,
        };
    },
);

export const processTask = ProcessScheduledAgent;