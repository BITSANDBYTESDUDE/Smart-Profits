"use client";

import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney } from "@/lib/format";

export function SmartPricingList() {
  const { result, currency } = useAnalysis();
  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          تسعير ذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.advisor.pricing.map((item) => (
          <div key={item.product} className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground">{item.product}</p>
            <p className="mt-2 text-sm text-slate-300">
              السعر الحالي {formatMoney(item.currentPrice, currency)} • التكلفة {formatMoney(item.cost, currency)} • الهامش {item.margin.toFixed(0)}%
            </p>
            <p className="mt-1 text-sm text-accent">
              السعر المقترح: {formatMoney(item.suggestedMin, currency)} — {formatMoney(item.suggestedMax, currency)}
            </p>
            <p className="mt-1 text-xs text-muted">{item.caution}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
