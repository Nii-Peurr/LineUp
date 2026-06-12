import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "muted" | "success" | "warning" | "danger" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  muted: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-amber-800 dark:text-amber-200",
  danger: "bg-destructive/12 text-destructive",
  outline: "border bg-transparent text-foreground"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
