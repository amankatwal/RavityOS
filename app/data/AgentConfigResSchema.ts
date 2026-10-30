import { z } from "zod";

export const AgentConfigRespSchema = z.object({
  status: z.enum(["needs_clarification", "ready"]),
  clarificationQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      type: z.enum([
        "single_select",
        "multi_select",
        "text",
        "number",
        "date",
        "time",
      ]),
      options: z.array(z.string()),
      allowCustom: z.boolean(),
      customPlaceholder: z.string(),
    })
  ),
  config: z.object({
    name: z.string(),
    description: z.string(),
    instructions: z.string(),
    objective: z.string(),
    tools: z.array(z.string()),
    skills: z.array(z.string()),
    schedule: z.preprocess(
      (value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return { type: "once", frequency: "Daily", time: "08:00" }
        }

        const schedule = value as Record<string, unknown>
        return {
          type: schedule.type === "recurring" ? "recurring" : "once",
          frequency: typeof schedule.frequency === "string" && schedule.frequency.trim() ? schedule.frequency : "Daily",
          time: typeof schedule.time === "string" && schedule.time.trim() ? schedule.time : "8:00",
        }
      },
      z.object({
        type: z.enum(["once", "recurring"]),
        frequency: z.string(),
        time: z.string(),
      })
    ),
    outputFormat: z.string(),
  }).nullable(),
});

export type AgentConfigType = z.infer<typeof AgentConfigRespSchema>;