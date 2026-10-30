import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps
  extends React.ComponentProps<typeof Button> {
  icon?: React.ReactNode;
  overlayClassName?: string;
}

export function AnimatedButton({
  children,
  icon,
  className,
  overlayClassName,
  ...props
}: AnimatedButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        `
        relative
        overflow-hidden
        group
        hover:cursor-pointer
        hover:scale-105
        transition-all
        duration-300
        `,
        className
      )}
    >
      {/* Sliding Overlay */}
      <div
        className={cn(
          `
          absolute
          inset-0
          translate-y-full
          bg-card-foreground
          transition-transform
          duration-300
          ease-in-out
          group-hover:translate-y-0
          `,
          overlayClassName
        )}
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-card">
        {icon}
        {children}
      </span>
    </Button>
  );
}