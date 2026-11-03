"use client"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import {
  Field,
  FieldError,
} from "@/components/ui/field"
import * as z from "zod"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ArrowUp, MessagesSquare, Paperclip, Sparkles, Square } from "lucide-react"
import { useAgentStore } from "../clientStore"
import React from "react"
import Image from "next/image"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from "ai"
import { useUser } from "@clerk/nextjs"
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const formSchema = z.object({
  prompt: z
    .string()
    .min(1, "Enter input")
})
 

export function AgentChat({agentId}: {agentId: string}) {
  const { user } = useUser()
   const { fetchAgentByID, savedAgent } = useAgentStore()
  const {messages, sendMessage,status,stop, error} = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
      body: {
        agentId : agentId,
      }
    })
  })
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  })
function onSubmit(data: z.infer<typeof formSchema>){
  sendMessage({text: data.prompt})
form.setValue("prompt","")
}
   
    const agentImage = savedAgent?.agentId === agentId && savedAgent.agentImage
      ? savedAgent.agentImage
      : "https://api.dicebear.com/10.x/gaze/svg?tags=animation&seed=Felix"
    React.useEffect(() => {
      if (sheetOpen) void fetchAgentByID(agentId)
    }, [agentId, fetchAgentByID, sheetOpen])
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger render={<Button variant={'secondary'} className={'cursor-pointer'}><MessagesSquare /> Chat with Agent</Button>} />
      <SheetContent className="data-[side=right]:w-[min(100vw,28rem)] data-[side=right]:max-w-none gap-0 border-border/70 bg-background p-0">
        <SheetHeader className="shrink-0 flex-row items-center gap-3 border-b px-5 py-4 pr-14">
          <Image
            src={agentImage}
            unoptimized
            width={40}
            height={40}
            className="size-10 rounded-full bg-muted object-cover ring-1 ring-border"
            alt=""
          />
          <div className="min-w-0">
            <SheetTitle className="truncate text-base">{savedAgent?.name || "Your agent"}</SheetTitle>
            <SheetDescription className="mt-0.5">Chat with your agent and give it a task</SheetDescription>
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-4 py-4 sm:px-5">
          <div>
            {messages.length > 0 ? 
          <div className="flex flex-col gap-4 py-2">
            <Message>
              <MessageAvatar>
                <Avatar size="sm">
                  <AvatarImage src={agentImage} alt={savedAgent?.name ?? "Agent"} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="muted" className="rounded-2xl text-foreground">
                  <BubbleContent>Hi, I&apos;m {savedAgent?.name || "your agent"}. How can I help today?</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
            {messages.map((message) => (
              <Message key={message.id} align={message.role === "user" ? "end" : "start"}>
                {message.role !== "user" && (
                  <MessageAvatar>
                    <Avatar size="sm">
                      <AvatarImage src={agentImage} alt={savedAgent?.name ?? "Agent"} />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                )}
                <MessageContent>
                  <Bubble className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"} rounded-2xl`}>
                    <BubbleContent>
                      
                      {message.parts.map((part, index) =>
                        part.type === "text" ? <span key={`${message.id}-${index}`}><Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown></span> : null
                      )}
                    
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
                {message.role === "user" && (
                  <MessageAvatar>
                    <Avatar size="sm">
                      {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={user.fullName ?? "You"} />}
                      <AvatarFallback>{user?.firstName?.slice(0, 2).toUpperCase() ?? "ME"}</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                )}
              </Message>
            ))}
              {(status === "submitted") && (
                <Message align="start" aria-live="polite">
                  <MessageAvatar>
                    <Avatar size="sm">
                      <AvatarImage src={agentImage} alt={savedAgent?.name ?? "Agent"} />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                    <Bubble variant="muted" className="rounded-2xl">
                      <BubbleContent>
                        <span className="chat-thinking-shimmer">Thinking...</span>
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              )}
          </div>  :  
          <div className="flex min-h-full flex-col justify-center gap-8 py-8">
            <div className="flex flex-col items-center gap-4 px-5 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-lg">Start a chat with {savedAgent?.name || "your agent"}</CardTitle>
                {savedAgent?.objective && <CardDescription>{savedAgent.objective}</CardDescription>}
              </div>
            </div>
            <Message>
              <MessageAvatar>
                <Avatar size="sm">
                  <AvatarImage src={agentImage} alt={savedAgent?.name ?? "Agent"} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="muted" className="rounded-2xl text-foreground">
                  <BubbleContent>Hi, I&apos;m {savedAgent?.name || "your agent"}. How can I help today?</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
                  </div>
          }
          {error && <div role="alert" className="px-5 py-3 text-sm text-destructive">{error.message}</div>}
          </div>
          
        </ScrollArea>
        <SheetFooter className="mt-0 shrink-0 border-t bg-background p-4">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="rounded-xl border border-border bg-card px-3 py-2 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
              <Controller
              name="prompt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <InputGroup className="border-0 bg-card dark:bg-card has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                    <InputGroupTextarea
                      {...field}
                      id="form-rhf-demo-description"
                      placeholder="Message your agent..."
                      rows={4}
                      className="field-sizing-fixed h-20 min-h-20 max-h-20 resize-none overflow-y-auto border-none bg-transparent dark:bg-card focus-visible:border-0 focus-visible:ring-0"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="block-end">
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="flex items-center justify-between pt-2">
            <Button className='rounded-full' variant="ghost" size="icon-sm" type="button" aria-label="Attach a file"><Paperclip /></Button>
            {
              status === "streaming" || status === "submitted" ? 
              <Button
              variant={"secondary"}
              type="button"
              onClick={stop}
              size="icon-sm"
              className={`rounded-full cursor-pointer`}
              >
                 <Square />
              </Button>
:
              <Button
              type="submit"
              size="icon-sm"
              className={`rounded-full bg-chart-2 cursor-pointer text-white hover:bg-chart-2 disabled:opacity-100`}
            ><ArrowUp /></Button>

            }
            </div>
            </div>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
