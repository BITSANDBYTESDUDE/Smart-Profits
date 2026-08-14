"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { cn } from "@/lib/utils";

export function RiskAlertCard() {
  const { result } = useAnalysis();
  if (!result) return null;
  const alert = result.forecast.alerts[0];
  if (!alert) return null;

  const high = alert.severity === "high";
  const positive = alert.severity === "positive";

  return (
    <Card
      className={cn(
        "p-5",
        high && "border-red-500/40 bg-red-500/8",
        positive && "border-accent/40 bg-accent/8",
        !high && !positive && "border-amber-500/30 bg-amber-500/8",
      )}
    >
      <div className="flex items-start gap-3">
        {positive ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
        ) : (
          <AlertTriangle className={cn("mt-0.5 h-5 w-5", high ? "text-red-400" : "text-amber-400")} />
        )}
        <div>
          <h3 className={cn("font-semibold", high ? "text-red-300" : positive ? "text-accent" : "text-amber-300")}>
            {alert.title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-200">{alert.message}</p>
          <p className="mt-2 text-sm text-slate-400">{alert.recommendation}</p>
        </div>
      </div>
    </Card>
  );
}
