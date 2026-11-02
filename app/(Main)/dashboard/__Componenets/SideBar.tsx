"use client"
import Link from "next/link";
import { Activity, BotMessageSquare, Layers, LayoutDashboard, MonitorCog, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/dashboard/agents", icon: BotMessageSquare },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
   { label: "Integrations", href: "/dashboard/profile", icon: MonitorCog },
   { label: "Templates", href: "/dashboard/templates", icon: Layers  },
  { label: "Settings", href: "/dashboard/profile", icon: Settings },
];

export default function SideBar({isPremium}:{isPremium: boolean}) {
  const pathname = usePathname();
  return (
    <aside className="border-b border-border bg-card lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="font-heading text-xl font-bold">
          <span className="text-muted-foreground">Ravity</span>
          <span className="text-primary">OS</span>
        </Link>
      </div>
      <div className="px-3 py-5">
        <p className="px-3 pb-3 text-[11px] font-semibold uppercase text-muted-foreground">
          Workspace
        </p>
        <nav aria-label="Dashboard navigation" className="flex gap-1 overflow-x-auto lg:flex-col">
          {navigation.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
            );
          })}
        </nav>
        {!isPremium && (
          <div className="mt-3 flex w-full justify-center lg:mt-20">
            <Link href="/#pricing"><Button variant="link">Upgrade to pro</Button></Link>
          </div>
        )}
      </div>
    </aside>
  );
}
