"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { trackPlatform } from "@/lib/admin/track";
import { formatMoney } from "@/lib/format";

export function ProfitLeaks() {
  const { result, currency } = useAnalysis();
  const leaks = result?.advisor.leaks ?? [];

  useEffect(() => {
    if (leaks.length) trackPlatform("leak");
  }, [leaks.length]);

  if (!result) return null;

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4 text-amber-300" />
          كاشف تسريب الأرباح
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaks.length === 0 && <p className="text-sm text-muted">لا يظهر تسريب واضح في هذا الملف.</p>}
        {leaks.map((leak) => (
          <div key={leak.id} className="rounded-xl border border-border bg-white/3 p-4">
            <p className="text-sm font-semibold text-white">{leak.product}</p>
            <p className="mt-1 text-xs text-muted">
              مبيعات {formatMoney(leak.revenue, currency)} • ربح {formatMoney(leak.profit, currency)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{leak.issue}</p>
            <p className="mt-1 text-sm leading-6 text-accent">{leak.suggestion}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
