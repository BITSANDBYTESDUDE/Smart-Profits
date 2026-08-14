"use client";

import { GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney } from "@/lib/format";

export function ProfitScenariosCard() {
  const { result, currency } = useAnalysis();
  if (!result) return null;
  const { scenarios } = result.advisor;

  const items = [
    { key: "worst", label: "أسوأ حالة (-15%)", tone: "text-red-300", point: scenarios.worst },
    { key: "expected", label: "المتوقع", tone: "text-amber-200", point: scenarios.expected },
    { key: "best", label: "أفضل حالة (+15%)", tone: "text-accent", point: scenarios.best },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          محاكي الربح — 3 سيناريوهات
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.key} className="rounded-xl border border-border bg-white/3 p-4">
            <p className="text-xs text-muted">{item.label}</p>
            <p className={`mt-2 text-xl font-bold ${item.tone}`}>{formatMoney(item.point.profit, currency)}</p>
            <p className="mt-1 text-xs text-slate-400">مبيعات {formatMoney(item.point.revenue, currency)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
