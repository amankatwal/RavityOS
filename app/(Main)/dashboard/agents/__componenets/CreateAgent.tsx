"use client"
import { Button } from '@/components/ui/button'
import { ArrowUp, Loader2Icon, Plus, Sparkles } from 'lucide-react'
import React from 'react'
import { 
  Search, 
  Mail, 
  Calendar, 
  Newspaper, 
  Briefcase 
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgentStore } from '../clientStore';
import AgentQuestionnaire from './AgentQuestionnaire';
import CreatedAgent from './CreatedAgent';

export default function CreateAgent() {
const {submitPrompt,userPrompt,agentConfigLoader, agentConfigResponse, createdAgentId} = useAgentStore()
  const onSubmit = async ()=>{
      await submitPrompt(prompt)
  }
    const [prompt, setPrompt] = React.useState("")
   const templates = [
  {
    title: "AI Job Hunter",
    description: "Searches top job boards daily and compiles matching listings.",
    icon: Briefcase,
    prompt: "Search the latest AI Engineer and Full-Stack Developer job postings across LinkedIn, Indeed, and Wellfound. Filter by remote roles, compile details into Google Sheets, and notify me on Slack.",
  },
  {
    title: "Inbox AI Assistant",
    description: "Scans important emails and sends daily executive summaries.",
    icon: Mail,
    prompt: "Check my Gmail inbox every morning at 8:00 AM, identify urgent or high-priority emails, summarize them into key action items, and send me a daily digest on Slack.",
  },
  {
    title: "Topic & Trend Researcher",
    description: "Extracts trending discussions from Reddit and web sources.",
    icon: Search,
    prompt: "Find the top 5 trending AI-related topics on Reddit from the past 24 hours, summarize the discussions, write the summary to Google Docs, and notify me on Slack every day at 8:00 AM.",
  },
  {
    title: "Meeting & Schedule Planner",
    description: "Organizes upcoming calendar events and prepares agendas.",
    icon: Calendar,
    prompt: "Review my Google Calendar for the upcoming week, identify schedule conflicts, draft follow-up reminders, and create a daily morning briefing of upcoming meetings.",
  },
  {
    title: "News & Market Briefing",
    description: "Monitors daily industry developments and creates structured reports.",
    icon: Newspaper,
    prompt: "Monitor tech news and market updates every weekday, extract key headlines and summaries, and save a structured briefing into a Notion or Google Docs document.",
  },
];
    const quickSuggestions = [
  {
    label: "Find AI Jobs",
    prompt: "Find the latest AI developer jobs posted this week that match my skillset",
  },
  {
    label: "Inbox Summary",
    prompt: "Check my inbox and summarize the most important emails today",
  },
  {
    label: "Research Topic",
    prompt: "Research a topic across the web, compare multiple sources, and summarize findings",
  },
  {
    label: "Plan My Day",
    prompt: "Check my calendar and upcoming tasks, then create a plan for the day",
  },
];
  return (
    <div className='mt-10 flex gap-10 flex-col w-full'>
      <div className=' flex flex-col gap-5'>
      <h1 className='text-2xl font-bold'>Create New Agent</h1>
      <p className='text-muted-foreground sm:text-lg'>Ask what type of agent you want to create. Type your goal, task or workflow</p></div>
        {agentConfigResponse?.status !== 'needs_clarification' && (
          <>
            <div className='w-full border bg-background p-3 mt-3 shadow-lg shadow-chart-2/30 hover:shadow-chart-2/70 transition-all duration-300 rounded-[0.75em] flex flex-col gap-3'>
        <div>
            <textarea 
                placeholder="Describe your agent's purpose..." 
                className='border-none min-h-[90px] resize-none w-full p-2 bg-transparent outline-0 sm:text-lg' 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
        <div className='flex justify-between'>
            <div className='flex gap-5'>
          <Button className='rounded-full hover:cursor-pointer' variant="secondary" size="icon-lg"><Plus /></Button>
          <span className='flex gap-3 items-center text-muted-foreground'><Sparkles size={15}/> AI Agent builder</span>
          </div>
<Button
  type="button"
  size="icon-lg"
  disabled={agentConfigLoader}
  onClick={onSubmit}
  className={`rounded-full ${agentConfigLoader ? "bg-chart-2 cursor-not-allowed" : " bg-chart-5 cursor-pointer"} text-white hover:bg-chart-2 disabled:opacity-100`}
>
  {agentConfigLoader ? (
    <Loader2Icon className="size-5 animate-spin" />
  ) : (
    <ArrowUp className="size-5" />
  )}
</Button>
        </div>
        </div>
        {agentConfigLoader ? <div className='w-full border px-5 py-2 bg-chart flex gap-5 shadow-lg items-center'>
          <Loader2Icon className='animate-spin'/> <span className='text-muted-foreground'>Generating agent config...</span>
        </div> : <div className=' flex flex-col gap-5'>
        <div className='flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-40'>
            {quickSuggestions.map((suggestion, index) => (
                <Button key={index} className='text-left hover:cursor-pointer hover:border-purple-700 hover:bg-purple-200 rounded-[0.5em] hover:text-purple-700 text-sm' variant="outline" size="sm" onClick={()=> setPrompt(suggestion.prompt)}>
                    {suggestion.label}
                </Button>
            ))}
        </div>
        {agentConfigResponse?.status !== 'ready' && (
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 sm:px-40'>
            {templates.map((template, index)=>(<Card key={index} className='hover:cursor-pointer' onClick={()=> setPrompt(template.prompt)}>
                <CardHeader>
                    <CardTitle>
                        <div className='flex flex-col gap-4'>
                            <span className='text-purple-700 p-3 bg-purple-700/10 w-fit'><template.icon /></span>
                           <h1> {template.title}</h1>
                        </div>
                    </CardTitle>
                  <CardDescription>
                        {template.description}
                    </CardDescription>
                </CardHeader>
            </Card>))}

        </div>
  )}
        </div>}
          </>
        )}
        {agentConfigResponse && userPrompt && (
          <>
            {agentConfigResponse.status !== 'ready' && (
              <div className='w-full border bg-muted/30 p-4 rounded-lg'>
                <p className='text-sm font-medium text-muted-foreground'>Your prompt</p>
                <p className='mt-2 whitespace-pre-wrap'>{userPrompt.split('\n\nClarifications:\n')[0]}</p>
              </div>
            )}
            {agentConfigLoader && agentConfigResponse.status === 'needs_clarification' ? (
              <div className='w-full border px-5 py-2 bg-chart flex gap-5 shadow-lg items-center'>
                <Loader2Icon className='animate-spin' />
                <span className='text-muted-foreground'>Generating agent config...</span>
              </div>
            ) : (
              <>
                {agentConfigResponse.status === 'ready' ? (
                  createdAgentId ? <CreatedAgent agentId={createdAgentId} /> : null
                ) : (
                  <AgentQuestionnaire
                    key={userPrompt}
                    response={agentConfigResponse}
                    onSubmit={(answers) => {
                      const clarifications = Object.entries(answers)
                        .map(([questionId, answer]) => `${questionId}: ${Array.isArray(answer) ? answer.join(', ') : answer}`)
                        .join('\n')
                      void submitPrompt(`${userPrompt}\n\nClarifications:\n${clarifications}`)
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
    </div>
  )
}
