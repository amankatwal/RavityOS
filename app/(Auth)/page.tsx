"use client";
import { PricingTable } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  FileText,
  Globe2,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "./clientStore";

export default function Home() {
  const {setNewUser} = useAuthStore()
  React.useEffect(()=>{
 setNewUser()
  }, [setNewUser])
  return (
    <div className="overflow-hidden">
      <main>
        <section className="relative isolate border-y border-border bg-muted/35">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] mask-[linear-gradient(to_bottom,black,transparent_88%)]" />
          <div className="mx-auto grid min-h-155 max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-12 lg:py-20">
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="mb-7 inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="size-2 bg-primary" />
                Your work, in motion
              </div>
              <h1 className="text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Ravity<span className="text-primary">OS</span>
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground sm:text-xl">
                Put your repeatable work on autopilot. Build AI agents that research, use your tools, and move tasks forward.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/sign-up">
                  <AnimatedButton size="lg" icon={<ArrowRight size={16} />}>
                    Build your first agent
                  </AnimatedButton>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-9 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-primary"
                >
                  See how it works <ArrowDown size={15} />
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-primary" /> Built around your workflow</span>
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-primary" /> You stay in control</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-155 animate-in fade-in slide-in-from-bottom-5 duration-1000">
              <div className="absolute -right-3 -top-3 z-10 flex items-center gap-2 border border-foreground bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-[4px_4px_0_var(--foreground)] sm:right-3">
                <span className="size-2 animate-pulse bg-current" /> AGENT RUNNING
              </div>
              <div className="border border-border bg-card text-card-foreground shadow-[10px_10px_0_color-mix(in_oklch,var(--primary)_30%,transparent)]">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center bg-primary text-primary-foreground"><Bot size={19} /></span>
                    <div>
                      <p className="text-sm font-bold">Research assistant</p>
                      <p className="text-xs text-muted-foreground">Weekly market brief</p>
                    </div>
                  </div>
                  <span className="border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live activity</span>
                </div>
                <div className="space-y-0 px-4 sm:px-5">
                  <div className="flex gap-3 border-b border-border py-5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center bg-muted"><Search size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Scanning recent sources</p>
                        <span className="text-xs text-muted-foreground">just now</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Finding relevant updates across trusted sites.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="border border-border px-2 py-1 text-xs">Industry news</span>
                        <span className="border border-border px-2 py-1 text-xs">Company updates</span>
                        <span className="border border-border px-2 py-1 text-xs">Citations on</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 border-b border-border py-5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center bg-muted"><Workflow size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Checking connected tools</p>
                        <span className="text-xs text-primary">Complete</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Gathering context from the services you selected.</p>
                    </div>
                    <Check size={16} className="mt-1 shrink-0 text-primary" />
                  </div>
                  <div className="flex gap-3 py-5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center bg-muted"><FileText size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Preparing your brief</p>
                      <div className="mt-3 h-1.5 w-full bg-muted"><div className="h-full w-2/3 bg-primary" /></div>
                    </div>
                    <Sparkles size={16} className="mt-1 shrink-0 text-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground sm:px-5">
                  <span className="inline-flex items-center gap-2"><Globe2 size={14} /> Research with cited sources</span>
                  <span>Run details <ArrowUpRight size={13} className="ml-1 inline" /></span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 bg-primary" /> A glimpse of an agent at work
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Platform capabilities" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">One workspace. More momentum.</p>
              <h2 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl">From a good idea to work getting done.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">Give an agent a goal, connect the tools it needs, and keep the important decisions in your hands.</p>
          </div>
          <div className="grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <article className="py-7 md:px-6 md:first:pl-0 md:last:pr-0">
              <span className="mb-5 grid size-10 place-items-center bg-primary text-primary-foreground"><Sparkles size={18} /></span>
              <h3 className="text-lg font-bold">Start with the outcome</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Describe the work in plain language. Shape the agent around your objective, instructions, and preferred output.</p>
            </article>
            <article className="py-7 md:px-6">
              <span className="mb-5 grid size-10 place-items-center bg-muted text-foreground"><Workflow size={18} /></span>
              <h3 className="text-lg font-bold">Bring your tools along</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Connect the services your workflow already depends on, then let the agent handle the steps between them.</p>
            </article>
            <article className="py-7 md:px-6">
              <span className="mb-5 grid size-10 place-items-center bg-muted text-foreground"><Globe2 size={18} /></span>
              <h3 className="text-lg font-bold">Work with fresh context</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Use current web research for questions that change over time, with sources included in the answer.</p>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-muted/35">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-12 lg:py-20">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">A simpler way to start</p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Make the workflow yours.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">No complicated setup. Build a useful first agent, then refine it as your process evolves.</p>
              <Link href="/sign-up" className="mt-7 inline-flex">
                <AnimatedButton size="lg" icon={<ArrowRight size={16} />}>
                  Get started
                </AnimatedButton>
              </Link>
            </div>
            <ol className="grid border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
              <li className="flex gap-4 border-b border-border py-5 sm:block sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
                <span className="text-xs font-bold text-primary">01</span>
                <div className="sm:mt-8"><h3 className="font-bold">Describe it</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Tell Ravity what needs doing.</p></div>
              </li>
              <li className="flex gap-4 border-b border-border py-5 sm:block sm:border-b-0 sm:px-5">
                <span className="text-xs font-bold text-primary">02</span>
                <div className="sm:mt-8"><h3 className="font-bold">Connect it</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Choose the tools and context it needs.</p></div>
              </li>
              <li className="flex gap-4 py-5 sm:block sm:px-5 sm:first:pl-0 sm:last:pr-0">
                <span className="text-xs font-bold text-primary">03</span>
                <div className="sm:mt-8"><h3 className="font-bold">Put it to work</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Run, review, and improve your agent.</p></div>
              </li>
            </ol>
          </div>
        </section>

        <section id="pricing" className="mx-auto flex max-w-7xl flex-col items-center gap-7 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="w-full border-b border-border pb-6 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">Plans</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Simple, transparent pricing.</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Choose the plan that fits the way you work. Change it as your needs grow.</p>
          </div>
          <div className="w-full overflow-x-auto">
            <PricingTable
              appearance={{
                theme: shadcn,
                elements: {
                  switchIndicator: { borderRadius: "0" },
                  switchThumb: {borderRadius:"0"},
                  pricingTableCardHeader: { display:"grid", gap: "12px" },
                  pricingTableCardBody:{ display: "grid", gap: "8px" },
                  pricingTableCardDescription:{ marginTop: "30px" }
                },
              }}
            />
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p className="font-bold">Ravity<span className="text-primary">OS</span></p>
          <p className="text-background/65">© {new Date().getFullYear()} RavityOS. Built for work that moves.</p>
          <Link href="#pricing" className="inline-flex items-center gap-2 font-semibold hover:text-primary">Plans <ArrowRight size={14} /></Link>
        </div>
      </footer>
    </div>
  );
}
