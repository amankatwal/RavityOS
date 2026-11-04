"use client"

import { PricingTable } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"

export default function PlanOnlyDashboard() {
  return (
    <section className="space-y-7">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Plans</p>
        <h1 className="mt-2 text-2xl font-bold">Choose a plan to continue</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Select a subscription to unlock your agent workspace. Your plan and included features are listed below.
        </p>
      </header>
      <div className="pricing-plan-grid w-full pb-2">
        <PricingTable
          newSubscriptionRedirectUrl="/auth-redirect"
          appearance={{
            theme: shadcn,
            elements: {
              switchIndicator: { borderRadius: "0" },
              switchThumb: { borderRadius: "0" },
              pricingTableCard: {
                border: "1px solid var(--border)",
                borderRadius: "0",
                boxShadow: "4px 4px 0 color-mix(in_oklch,var(--primary)_12%,transparent)",
              },
              pricingTableCardHeader: { display: "grid", gap: "12px", padding: "24px" },
              pricingTableCardBody: { display: "grid", gap: "12px", padding: "0 24px 24px" },
              pricingTableCardDescription: { marginTop: "0", lineHeight: "1.6" },
            },
          }}
        />
      </div>
    </section>
  )
}