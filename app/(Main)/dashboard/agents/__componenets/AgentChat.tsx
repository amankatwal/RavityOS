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
      <SheetContent className="data-[side=right]:w-screen data-[side=right]:sm:max-w-none lg:data-[side=right]:w-1/3">
        <SheetHeader>
            <SheetHeader className="flex flex-row gap-4 items-center">
                        <div>
                        <Image src={agentImage} unoptimized width={30} height={30} alt="avatar" />
                        </div>
                        <div>
                      <SheetTitle>{savedAgent?.name}</SheetTitle>
                      <SheetDescription>
                        Chat wiith your agent and give it a task
                      </SheetDescription></div>
                    </SheetHeader>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <DropdownMenuSeparator />
        <ScrollArea className="min-h-0 flex-1 py-10">
          <div>
            {messages.length > 0 ? 
          <div className="flex flex-col gap-3 px-5 py-5">
            <Message>
          <MessageAvatar>
                    <Avatar size="sm">
                      <AvatarImage src={agentImage} alt={savedAgent?.name ?? "Agent"} />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                  <Bubble className={`bg-muted text-muted-foreground rounded-[2em]`}>
                    <BubbleContent>
                     Hi i am {savedAgent?.name}, How can I help you today?
                    </BubbleContent>
                  </Bubble>
                </MessageContent></Message>
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
                  <Bubble className={`${message.role === "user" ? "bg-chart-5/70 text-white" : "bg-muted text-muted-foreground"} rounded-[2em] mt-3`}>
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
                    <Bubble variant="muted" className="rounded-[1em]">
                      <BubbleContent>
                        <span className="chat-thinking-shimmer">Thinking...</span>
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              )}
          </div>  :  
         <div>

         
          <div className="flex flex-col mt-10 justify-end items-center gap-10">
            <div className="bg-purple-700/20 text-purple-700 p-4 rounded-full">
              <Sparkles /></div>
              <div className="flex flex-col items-center px-5 gap-5 text-center">
              <CardTitle>
                Start a chat with {savedAgent?.name}
              </CardTitle>
              <CardDescription>
                {savedAgent?.objective}
              </CardDescription>
              </div>
          </div>
          <Message className="mt-5">
          <MessageAvatar>
                    <Avatar size="sm">
                      <AvatarImage src={agentImage} alt={savedAgent?.name ?? "Agent"} />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                  <Bubble className={`bg-muted text-muted-foreground rounded-[2em]`}>
                    <BubbleContent>
                     Hi i am {savedAgent?.name}, How can I help you today?
                    </BubbleContent>
                  </Bubble>
                </MessageContent></Message>
                  </div>
          }
          {error && <div role="alert" className="px-5 py-3 text-sm text-destructive">{error.message}</div>}
          </div>
          
        </ScrollArea>
        <SheetFooter>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="border rounded-[0.75em] bg-card px-3 py-3 border-purple-700/20 hover:border-purple-700 shadow-md shadow-purple-700/20 hover:shadow-purple-700">
              <Controller
              name="prompt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <InputGroup className="border-0 bg-card dark:bg-card has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                    <InputGroupTextarea
                      {...field}
                      id="form-rhf-demo-description"
                      placeholder="Chat with your Agent"
                      rows={6}
                      className="field-sizing-fixed h-24 min-h-24 max-h-24 resize-none overflow-y-auto border-none bg-transparent dark:bg-card focus-visible:border-0 focus-visible:ring-0"
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
            <div className="flex justify-between">
            <Button className='rounded-full hover:cursor-pointer' variant="secondary" size="icon-lg" type="button"><Paperclip /></Button>
            {
              status === "streaming" || status === "submitted" ? 
              <Button
              variant={"secondary"}
              type="button"
              onClick={stop}
              size="icon-lg"
              className={`rounded-full cursor-pointer`}
              >
                 <Square />
              </Button>
:
              <Button
              type="submit"
              size="icon-lg"
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
