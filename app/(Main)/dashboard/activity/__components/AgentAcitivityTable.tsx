"use client"
import React from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useActivityStore } from '../clientStore' 
import { useEffect } from "react"
import moment from "moment"

export default function AgentAcitivityTable() {
      const {fetchAgentRuns, agentRunsLoader, agentRuns} = useActivityStore()

  useEffect(()=>{
   fetchAgentRuns()
    console.log(agentRuns)
  },[])
  return (
          <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Agent</TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Updated</TableHead>
          <TableHead className="text-right">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agentRuns.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>{agent.task}</TableCell>
            <TableCell>{agent.status}</TableCell>
            <TableCell>{moment(agent.updatedAt).fromNow()}</TableCell>
            <TableCell className="text-right">{agent.output ? "View Result" : null}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
