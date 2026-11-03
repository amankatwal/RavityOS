"use client"
import Link from "next/link";
import { Activity, ArrowUpRight, BotMessageSquare, LayoutDashboard, MonitorCog, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/dashboard/agents", icon: BotMessageSquare },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Integrations", href: "/dashboard/integrations", icon: MonitorCog },
];

export default function SideBar({ isPremium }: { isPremium: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-border bg-card lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground">
          <LayoutDashboard aria-hidden="true" className="size-4" />
        </span>
        <Link href="/dashboard" className="flex flex-col leading-none">
          <span className="font-heading text-lg font-bold">
            <span className="text-muted-foreground">Ravity</span>
            <span className="text-primary">OS</span>
          </span>
          <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Agent workspace
          </span>
        </Link>
      </div>

      <div className="flex flex-col px-3 py-4 lg:min-h-0 lg:flex-1 lg:py-5">
        <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Workspace
        </p>
        <nav aria-label="Dashboard navigation" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {navigation.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={label}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex shrink-0 items-center gap-3 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={`flex size-8 items-center justify-center transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                }`}>
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span>{label}</span>
                {isActive && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 bg-primary lg:inset-y-2 lg:left-0 lg:right-auto lg:h-auto lg:w-0.5" />}
              </Link>
            );
          })}
        </nav>
        {!isPremium && (
          <div className="mt-4 border-t border-border pt-4 lg:mt-auto lg:pt-6">
            <Link
              href="/#pricing"
              className="group flex items-center justify-between gap-3 border border-primary/20 bg-primary/5 px-3 py-3 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <Sparkles aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">Upgrade to Pro</span>
                  <span className="mt-1 block truncate text-[11px] text-muted-foreground">Get more from your workspace</span>
                </span>
              </span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
