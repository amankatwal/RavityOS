import { AnimatedButton } from "@/components/ui/AnimatedButton"
import { useEffect, useState, type ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import logo from "@/public/connect.png"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Loader2, Pencil, Plus, X } from "lucide-react"
import Image from "next/image"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AgentConfigRespSchema, type AgentConfigType } from '@/app/data/AgentConfigResSchema'
import { useAgentStore } from '../clientStore'
import { z } from "zod"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

const agentEditSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required"),
  objective: z.string().trim().min(1, "Objective is required"),
  instructions: z.string().trim().min(1, "Instructions are required"),
  outputFormat: z.string().trim().min(1, "Output format is required"),
  schedule: z.object({
    type: z.enum(["Manual","once", "recurring"]),
    time: z.string().min(1, "Choose a run time"),
    frequency: z.enum(["Hourly","Daily", "Weekly", "Monthly"]),
  }),
  skills: z.array(z.string().trim().min(1)).min(1, "Add at least one skill"),
})

type AgentEditValues = z.infer<typeof agentEditSchema>
const agentEditFormSchema = agentEditSchema.extend({ skillDraft: z.string() })
type AgentEditFormValues = z.infer<typeof agentEditFormSchema>

const scheduleTypeOptions = [
  { label: "Once", value: "once" as const },
  { label: "Recurring", value: "recurring" as const },
]

const scheduleFrequencyOptions = [
  { label: "Hourly", value: "Hourly" as const },
  { label: "Daily", value: "Daily" as const },
  { label: "Weekly", value: "Weekly" as const },
  { label: "Monthly", value: "Monthly" as const },
]

const normalizeScheduleType = (value?: string) =>
  value === "recurring" ? "recurring" : "once"

const normalizeScheduleFrequency = (value?: string) =>
  value === "Hourly" || value === "Daily" || value === "Weekly" || value === "Monthly"
    ? value
    : "Daily"

function toTimeInputValue(value?: string) {
  if (!value?.trim()) return "08:00"

  const twelveHourTime = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (twelveHourTime) {
    let hours = Number(twelveHourTime[1]) % 12
    if (twelveHourTime[3].toUpperCase() === "PM") hours += 12
    return `${String(hours).padStart(2, "0")}:${twelveHourTime[2]}`
  }

  const twentyFourHourTime = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHourTime && Number(twentyFourHourTime[1]) < 24 && Number(twentyFourHourTime[2]) < 60) {
    return `${String(Number(twentyFourHourTime[1])).padStart(2, "0")}:${twentyFourHourTime[2]}`
  }

  return "08:00"
}

type AgentEditSheetProps = {
  agentId: string
  response: AgentConfigType
  onSave?: (values: AgentEditValues) => void
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AgentEditSheet({ agentId, response, onSave, trigger, open, onOpenChange }: AgentEditSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const sheetOpen = open ?? internalOpen
  const { updateAgentConfig, agentUpdateLoader, fetchAgentByID, savedAgent, getComposio, agentTools, connectionLoader,connectionBreak, connectionRequest, agentToolLoader } = useAgentStore()
  const agentImage = savedAgent?.agentId === agentId && savedAgent.agentImage
    ? savedAgent.agentImage
    : "https://api.dicebear.com/10.x/gaze/svg?tags=animation&seed=Felix"
  const config = response.config
  const form = useForm<AgentEditFormValues>({
    resolver: zodResolver(agentEditFormSchema),
    defaultValues: {
      name: config?.name ?? "",
      objective: config?.objective ?? "",
      instructions: config?.instructions ?? "",
      outputFormat: config?.outputFormat ?? "Plain text",
      schedule: {
        type: normalizeScheduleType(config?.schedule.type),
        time: toTimeInputValue(config?.schedule.time),
        frequency: normalizeScheduleFrequency(config?.schedule.frequency),
      },
      skills: config?.skills ?? [],
      skillDraft: "",
    },
  })
  const runType = useWatch({ control: form.control, name: "schedule.type" })
  const skillDraft = useWatch({ control: form.control, name: "skillDraft" })

  useEffect(() => {
    if (sheetOpen) void getComposio(agentId)
  }, [agentId, getComposio, sheetOpen])

  useEffect(() => {
    if (sheetOpen) void fetchAgentByID(agentId)
  }, [agentId, fetchAgentByID, sheetOpen])

  useEffect(() => {
    if (!sheetOpen || savedAgent?.agentId !== agentId) return

    const savedResponse = AgentConfigRespSchema.parse({
      status: 'ready',
      clarificationQuestions: [],
      config: {
        name: savedAgent.name ?? "",
        description: savedAgent.description ?? "",
        instructions: savedAgent.instructions ?? "",
        objective: savedAgent.objective ?? "",
        tools: savedAgent.tools,
        skills: savedAgent.skills,
        schedule: savedAgent.schedule,
        outputFormat: savedAgent.outputFormat ?? "Plain text",
      },
    })
    const savedConfig = savedResponse.config

    if (savedConfig) {
      form.reset({
        name: savedConfig.name,
        objective: savedConfig.objective,
        instructions: savedConfig.instructions,
        outputFormat: savedConfig.outputFormat,
        schedule: {
          type: normalizeScheduleType(savedConfig.schedule.type),
          time: toTimeInputValue(savedConfig.schedule.time),
          frequency: normalizeScheduleFrequency(savedConfig.schedule.frequency),
        },
        skills: savedConfig.skills,
        skillDraft: "",
      })
    }
  }, [agentId, form, savedAgent, sheetOpen])

  const addSkill = () => {
    const skill = form.getValues("skillDraft").trim()
    const skills = form.getValues("skills")
    if (!skill || skills.some((existingSkill) => existingSkill.toLowerCase() === skill.toLowerCase())) {
      return
    }
    form.setValue("skills", [...skills, skill], { shouldDirty: true, shouldValidate: true })
    form.setValue("skillDraft", "")
  }

const submitForm = form.handleSubmit(async (values) => {
  const configValues = agentEditSchema.parse(values)

  const updated = await updateAgentConfig(agentId, {
    ...configValues,
    schedule: {
      ...configValues.schedule,
      timezone:
        savedAgent?.schedule &&
        typeof savedAgent.schedule === "object" &&
        "timezone" in savedAgent.schedule &&
        typeof savedAgent.schedule.timezone === "string"
          ? savedAgent.schedule.timezone
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    status: savedAgent?.status === "pause" ? "pause" : "active",
  })

  if (updated) {
    onSave?.(configValues)
    await fetchAgentByID(agentId)
    setSheetOpen(false)
  }
})

  const setSheetOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <Sheet
      open={sheetOpen}
      onOpenChange={(nextOpen) => {
        setSheetOpen(nextOpen)
      }}
    >
      <SheetTrigger render={trigger ?? <Button variant="outline" size="sm" className="cursor-pointer gap-2"><Pencil /></Button>} />
      <SheetContent>
        <SheetHeader className="flex flex-row gap-4 items-center">
            <div>
            <Image src={agentImage} unoptimized width={30} height={30} alt="avatar" />
            </div>
            <div>
          <SheetTitle>Edit Agent</SheetTitle>
          <SheetDescription>
            Update how this agent looks works and more.
          </SheetDescription></div>
        </SheetHeader>
        <DropdownMenuSeparator />
        <ScrollArea className="min-h-0 flex-1">
         <form id="agent-edit-form" onSubmit={submitForm} noValidate>
         <div className="flex flex-col gap-5">
    <Card className="border rounded-[0.75em] my-5 py-5 mx-5">
        <CardHeader className="flex gap-3 items-center">
            <Image src={agentImage} unoptimized width={88} height={88} alt="avatar" />
            <CardTitle className="font-bold">{savedAgent?.agentId === agentId ? savedAgent.name : config?.name}</CardTitle> 
        </CardHeader>
    </Card>
    {agentToolLoader ? <div className="flex justify-center">
      <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-62.5" />
        <Skeleton className="h-4 w-50" />
      </div>
    </div>
    </div> : 
    <div className="w-full py-5 sm:px-10 px-3 flex flex-col gap-5">
      
  {agentTools.map((agent)=><div key={agent.slug} className='border rounded-[0.75em] py-5 px-3 flex items-center justify-between gap-5'>
    <div className="flex items-center gap-3">
      
<Image src={agent.logo ?? logo} width={40} height={40} alt={agent.slug} unoptimized/>
<div>
<h1 className="text-md font-bold ">{agent.name}</h1>
<h1 className={`text-xs font-semibold ${agent.connected ? "text-green-500" : "text-red-600"}`}>{agent.connected ? "Connected": "Disconnected"}</h1>
</div>
</div>
<AnimatedButton disabled={connectionLoader === agent.slug} onClick={async()=>savedAgent && (agent.connected ? await connectionBreak(agent.slug, savedAgent?.agentId) : await connectionRequest(agent.slug, savedAgent?.agentId), setSheetOpen(false) )}>{connectionLoader === agent.slug && <Loader2 className="animate-spin"/>}{agent.connected ? "Disconnect" : "Connect"}</AnimatedButton>
  </div>)}
    </div>}
      <div className="px-5">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="agent-name">Agent Name</FieldLabel>
              <Input id="agent-name" className="bg-background border-none" aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
     </div>
      <div className="px-5">
        <Controller
          control={form.control}
          name="objective"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="agent-objective">Objective</FieldLabel>
              <Textarea id="agent-objective" className="bg-background h-[10vh] overflow-y-auto scrollbar-hide border-none" aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
     </div>
      <div className="px-5">
        <Controller
          control={form.control}
          name="instructions"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="agent-instructions">Instructions</FieldLabel>
              <Textarea id="agent-instructions" className="bg-background h-[10vh] overflow-y-auto scrollbar-hide border-none" aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
     </div>
     <div className="px-5">
        <Controller
          control={form.control}
          name="outputFormat"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="agent-output-format">Output format</FieldLabel>
              <Textarea id="agent-output-format" className="bg-background border-none" aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
     </div>
     <section className="mx-5 space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="text-sm font-medium">Schedule</h3>
          <p className="text-xs text-muted-foreground">Choose when and how often this agent runs.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="schedule.type"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="agent-run-type">Run type</FieldLabel>
                <select id="agent-run-type" className="h-9 w-full rounded-md border bg-background px-3 text-sm" aria-invalid={fieldState.invalid} {...field}>
                  {scheduleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="schedule.time"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="agent-run-time">Time</FieldLabel>
                <Input id="agent-run-time" type="time" className="bg-background" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
        {runType === "recurring" && (
          <Controller
            control={form.control}
            name="schedule.frequency"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="agent-frequency">Frequency</FieldLabel>
                <select id="agent-frequency" className="h-9 w-full rounded-md border bg-background px-3 text-sm" aria-invalid={fieldState.invalid} {...field}>
                  {scheduleFrequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        )}
     </section>
     <section className="mx-5 space-y-3">
        <div>
          <h3 className="text-sm font-medium">Skills</h3>
          <p className="text-xs text-muted-foreground">Add skills this agent should use.</p>
        </div>
        <Controller
          control={form.control}
          name="skills"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex min-h-16 flex-wrap content-start gap-2 rounded-lg border p-3" aria-invalid={fieldState.invalid}>
                {field.value.map((skill) => (
                  <span key={skill} className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-3 text-xs">
                    {skill}
                    <button
                      type="button"
                      aria-label={`Remove ${skill}`}
                      className="rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => field.onChange(field.value.filter((item) => item !== skill))}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <div className="flex gap-2">
          <Controller
            control={form.control}
            name="skillDraft"
            render={({ field }) => (
              <Input
                aria-label="Add a skill"
                placeholder="Add a skill"
                className="bg-background"
                {...field}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addSkill()
                  }
                }}
              />
            )}
          />
          <Button type="button" variant="outline" size="icon" aria-label="Add skill" disabled={!skillDraft.trim()} onClick={addSkill}>
            <Plus />
          </Button>
        </div>
     </section>
         </div>
         </form>
        </ScrollArea>
        <SheetFooter>
          <AnimatedButton type="submit" form="agent-edit-form" disabled={form.formState.isSubmitting || agentUpdateLoader}>Save changes</AnimatedButton>
          <SheetClose render={<Button variant="outline">Close</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
