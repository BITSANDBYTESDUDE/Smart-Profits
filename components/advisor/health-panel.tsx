"use client";

import { Activity, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthRing } from "@/components/dashboard/kpi-cards";
import { useAnalysis } from "@/context/analysis-context";
import { cn } from "@/lib/utils";

const TONE = {
  good: "text-accent",
  warn: "text-amber-300",
  bad: "text-red-300",
};

export function HealthPanel() {
  const { result } = useAnalysis();
  if (!result) return null;
  const { health } = result.advisor;

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-accent" />
          طبيب المتجر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-5">
          <HealthRing score={health.score} label={health.label} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">Store Health</p>
            <p className="text-3xl font-bold text-white">{health.score}/100</p>
            <p className="mt-2 text-sm leading-7 text-slate-200">{health.headline}</p>
          </div>
        </div>
        <div className="space-y-2">
          {health.findings.map((finding) => (
            <div key={finding.id} className="rounded-xl border border-border bg-white/3 p-3">
              <p className={cn("text-sm font-semibold", TONE[finding.tone])}>{finding.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{finding.detail}</p>
            </div>
          ))}
        </div>
        {health.daysUntilProblem != null && health.daysUntilProblem > 0 && (
          <p className="flex items-center gap-2 text-xs text-amber-200">
            <Activity className="h-3.5 w-3.5" />
            نافذة القرار التقريبية: {health.daysUntilProblem} يوماً قبل أن يظهر الضغط بوضوح.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
