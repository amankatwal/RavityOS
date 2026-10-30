import { Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8" id="overview">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{new Date().toLocaleDateString("en-IN", {weekday: "short"})}, {new Date().toLocaleDateString("en-IN", {month: "short"})} {new Date().getDate()}</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Here’s what’s happening across your workspace.</p>
        </div>
        <Link
          href="#projects"
          className="inline-flex h-9 items-center justify-center gap-2 self-start bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 sm:self-auto"
        >
          <Plus aria-hidden="true" className="size-4" />
         Add Resume
        </Link>
      </section>

      
    </div>
  );
}
