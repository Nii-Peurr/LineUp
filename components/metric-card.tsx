import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = "default"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md",
            tone === "success" && "bg-success/12 text-success",
            tone === "warning" && "bg-warning/16 text-amber-800 dark:text-amber-200",
            tone === "default" && "bg-primary/12 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend ? (
        <Badge variant={tone === "warning" ? "warning" : tone === "success" ? "success" : "muted"} className="mt-4">
          {trend}
        </Badge>
      ) : null}
    </Card>
  );
}
