"use client"

import React from 'react'
import { motion } from "motion/react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import CreateAgent from './__componenets/CreateAgent'
import MyAgents from './__componenets/MyAgents'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
}
export default function page() {
  return (
    <motion.div className="w-full" variants={containerVariants} initial="hidden" animate="show">
      <Tabs defaultValue="create-agents" className="w-full">
        <motion.div variants={itemVariants} className="w-fit">
          <TabsList>
            <TabsTrigger value="create-agents" className="hover:cursor-pointer">Create Agent</TabsTrigger>
            <TabsTrigger value="your-agents" className="hover:cursor-pointer">Your Agents</TabsTrigger>
          </TabsList>
        </motion.div>
        <TabsContent value="create-agents">
          <motion.div variants={itemVariants}><CreateAgent /></motion.div>
        </TabsContent>
        <TabsContent value="your-agents">
          <motion.div variants={itemVariants}><MyAgents /></motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
