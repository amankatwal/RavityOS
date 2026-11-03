"use client"
import React from 'react'
import { Check, Search, Wrench } from 'lucide-react'
import { useToolsStore } from './clientStore'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { Button } from '@/components/ui/button'

export default function ToolCards() {
    const {fetchAllTools, tools, toolsLoader, connectTool, disconnectTool} = useToolsStore()
  const [query, setQuery] = React.useState('')
  const [connectionFilter, setConnectionFilter] = React.useState<'all' | 'connected' | 'available'>('all')

    React.useEffect(()=>{
    fetchAllTools()
  },[fetchAllTools])

  const visibleTools = tools.filter((tool) => {
    const matchesQuery = `${tool.name} ${tool.description ?? ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
    const isConnected = tool.connected === 'ACTIVE'
    const matchesConnection = connectionFilter === 'all'
      || (connectionFilter === 'connected' && isConnected)
      || (connectionFilter === 'available' && !isConnected)

    return matchesQuery && matchesConnection
  })

  return (
  <section className="space-y-7">
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Tools your agents can work with.</p>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{tools.length}</span> {tools.length === 1 ? 'tool' : 'tools'} available
      </p>
    </header>

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="Search integrations"
          className="h-10 w-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools"
          type="search"
          value={query}
        />
      </div>
      <div aria-label="Filter integrations" className="flex border border-border" role="group">
        {([
          ['all', 'All tools'],
          ['connected', 'Connected'],
          ['available', 'Available'],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={connectionFilter === value}
            className={`min-h-9 px-3 text-xs font-medium transition-colors ${connectionFilter === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            key={value}
            onClick={() => setConnectionFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    {toolsLoader ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading integrations">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="h-48 animate-pulse border border-border bg-muted/50" key={index} />
        ))}
      </div>
    ) : visibleTools.length === 0 ? (
      <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
        <Wrench aria-hidden="true" className="size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold">{tools.length === 0 ? 'No integrations available' : 'No matching tools'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {tools.length === 0 ? 'Available tools will appear here.' : 'Adjust your search or connection filter.'}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...visibleTools].sort((a, b) => Number(b.connected === 'ACTIVE') - Number(a.connected === 'ACTIVE')).map((tool) => {
          const isConnected = tool.connected === 'ACTIVE'

          return (
            <div className='relative' key={tool.id}>
            <article
              className={`group relative flex min-h-60 flex-col overflow-hidden rounded-md border px-5 pb-20 pt-5 transition-[opacity,border-color,background-color,box-shadow] duration-200 ${isConnected
                ? 'border-emerald-700/35 bg-emerald-700/[0.035] shadow-sm shadow-emerald-900/5'
                : 'border-border/70 bg-card/70 opacity-60 hover:opacity-100'} hover:border-foreground/30`}
            >
              {isConnected && <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
              <div className="flex items-start justify-between gap-4">
                <div className={`relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border text-sm font-semibold uppercase ${isConnected ? 'border-emerald-700/25 bg-emerald-700/10 text-emerald-800' : 'border-border bg-muted text-muted-foreground'}`}>
                  <span>{tool.name.slice(0, 1)}</span>
                  {tool.icon && <img alt="" className="absolute inset-0 size-full bg-card object-contain p-2" src={tool.icon} />}
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-medium ${isConnected ? 'border-emerald-700/25 bg-emerald-700/10 text-emerald-800' : 'border-border bg-muted/70 text-muted-foreground'}`}>
                  {isConnected && <Check aria-hidden="true" className="size-3" />}
                  {isConnected ? 'Connected' : 'Available'}
                </span>
              </div>

              <div className="mt-5 min-w-0">
                <h2 className="truncate text-base font-semibold leading-5">{tool.name}</h2>
              </div>

              {tool.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-5 text-muted-foreground">{tool.description}</p>
              )}
             
            </article>
            <div className='absolute bottom-4 left-5 right-5 flex'>
             {tool.connected === "ACTIVE" ? <Button className='w-full cursor-pointer' variant={'secondary'} onClick={()=>disconnectTool(tool.connectedTools?.id, tool.name)}>Disconnect</Button> : <AnimatedButton className='w-full' onClick={()=> connectTool(tool.slug)}>Connect</AnimatedButton>}
            </div>
            </div>
          )
        })}
      </div>
    )}
  </section>
  )
}
