import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  suppressHydrationWarning = true,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      suppressHydrationWarning={suppressHydrationWarning}
      className={cn(
        "flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
