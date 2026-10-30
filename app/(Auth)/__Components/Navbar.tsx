
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import * as React from "react"
import {
  Show,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import ToggleTheme from "@/components/ui/ToggleTheme";

export default function Navbar() {

  return (
   <div className="flex justify-between px-10 py-5">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        <span className="text-muted-foreground">Ravity</span><span className="text-primary">OS</span>
      </h1>
      <div className="flex items-center gap-3 text-lg">
        <ToggleTheme />
        <Show when="signed-out">
            <Link href="/sign-in">
        <AnimatedButton size="lg">
          Sign-in
        </AnimatedButton></Link>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard">
          <AnimatedButton>
            Dashboard
          </AnimatedButton></Link>
          <UserButton />
        </Show>
      </div>
    </div>
  )
}
