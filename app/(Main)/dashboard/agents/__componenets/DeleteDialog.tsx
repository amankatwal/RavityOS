import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader, Trash } from "lucide-react"
import { useState } from "react";
import { useAgentStore } from "../clientStore";
interface DeleteDialogProps {
  agentId: string
  open: boolean
   onOpenChange: (open: boolean) => void
}
export function DeleteDialog({
  agentId,
  open,
  onOpenChange
}: DeleteDialogProps) {
  const {agentDeleteLoader, deleteAgent} = useAgentStore()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
    
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            Agent and the tasks associated with the agent!.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={`hover:cursor-pointer `} onClick={()=>deleteAgent(agentId)}>{agentDeleteLoader ? <Loader className={`${agentDeleteLoader && 'animate-spin'}`} /> : "Continue" }</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
