import { Crown, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initials, minutesLabel } from "@/lib/utils";
import type { QueueEntry } from "@/lib/types";

export function QueueList({
  entries,
  compact = false,
  emptyMessage = "No customers waiting"
}: {
  entries: QueueEntry[];
  compact?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="divide-y overflow-hidden rounded-lg border bg-card">
      {entries.length ? (
        entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
              {entry.status === "serving" ? "NOW" : entry.position}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">{entry.customerName}</p>
                {entry.fastPass ? (
                  <Badge variant="warning">
                    <Crown className="mr-1 h-3 w-3" />
                    Fast Pass
                  </Badge>
                ) : null}
                <Badge
                  variant={
                    entry.status === "serving"
                      ? "success"
                      : entry.status === "waiting"
                        ? "muted"
                        : "outline"
                  }
                >
                  {entry.status}
                </Badge>
              </div>
              {!compact ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  Quoted {minutesLabel(entry.quotedWaitMinutes)}
                </p>
              ) : null}
            </div>
            <div className="hidden h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary sm:flex">
              {initials(entry.customerName)}
            </div>
          </div>
        ))
      ) : (
        <div className="p-5 text-sm text-muted-foreground">{emptyMessage}</div>
      )}
    </div>
  );
}
