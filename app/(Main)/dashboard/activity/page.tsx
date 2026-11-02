"use client"

import { motion } from "motion/react"
import { Activity } from "lucide-react"
import AgentAcitivityTable from "./__components/AgentAcitivityTable";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
}




export default function page() {
  return (
    <motion.div className="flex flex-col gap-6 pb-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Execution monitor</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold"><span className="flex size-10 items-center justify-center bg-chart-2/10 text-chart-2"><Activity aria-hidden="true" className="size-5" /></span>Activity</h1>
          <p className="mt-3 text-sm text-muted-foreground">Track agent runs, review results, and respond when an agent needs you.</p>
        </div>
        <div className="inline-flex h-9 items-center gap-2 self-start border border-border bg-card px-3 text-xs font-medium text-muted-foreground sm:self-auto">
          <span className="size-2 animate-pulse bg-emerald-600" /> Live updates
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <AgentAcitivityTable />
      </motion.div>
    </motion.div>
  )
}
