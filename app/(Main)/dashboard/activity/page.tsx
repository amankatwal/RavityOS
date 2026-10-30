import AgentAcitivityTable from "./__components/AgentAcitivityTable";




export default function page() {

  return (
    <div className='flex flex-col gap-5'>
      <h1 className='text-3xl font-bold'>Activity</h1>
      <p className='text-muted-foreground text-sm'>See what your agents working on and the results</p>
      <AgentAcitivityTable />
    </div>
  )
}
