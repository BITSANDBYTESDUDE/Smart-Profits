"use client";

import { Radar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/context/analysis-context";

const LEVEL = {
  high: { label: "مرتفع", tone: "danger" as const },
  medium: { label: "متوسط", tone: "warning" as const },
  low: { label: "منخفض", tone: "info" as const },
  good: { label: "جيد", tone: "success" as const },
};

export function RiskRadar() {
  const { result } = useAnalysis();
  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-red-300" />
          رادار مخاطر العمل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {result.advisor.risks.map((risk) => (
          <div key={risk.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium text-white">{risk.label}</p>
              <p className="text-xs text-muted">{risk.reason}</p>
            </div>
            <Badge tone={LEVEL[risk.level].tone}>{LEVEL[risk.level].label}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
