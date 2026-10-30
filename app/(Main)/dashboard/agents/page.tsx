import React from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import CreateAgent from './__componenets/CreateAgent'
import MyAgents from './__componenets/MyAgents'
export default function page() {
  return (
    <Tabs defaultValue="create-agents" className="w-full">
      <TabsList>
        <TabsTrigger value="create-agents" className="hover:cursor-pointer">Create Agent</TabsTrigger>
        <TabsTrigger value="your-agents" className="hover:cursor-pointer">Your Agents</TabsTrigger>
        
      </TabsList>
      <TabsContent value="create-agents">
        <CreateAgent />
      </TabsContent>
      <TabsContent value="your-agents">
        <MyAgents />
      </TabsContent>
      
    </Tabs>
  )
}
