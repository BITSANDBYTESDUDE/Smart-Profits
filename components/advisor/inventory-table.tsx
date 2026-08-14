"use client";

import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney } from "@/lib/format";

const DECISION = {
  order_now: { label: "اطلب الآن", tone: "danger" as const },
  dont_buy: { label: "لا تشتري", tone: "warning" as const },
  watch: { label: "راقب", tone: "success" as const },
};

export function InventoryAdviceTable() {
  const { result, currency } = useAnalysis();
  if (!result) return null;
  const rows = result.advisor.inventory;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          مخزون مبني على الربح
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <p className="mb-3 text-xs text-muted">المخزون تقديري من سرعة البيع لأن الملف قد لا يحتوي عمود جرد.</p>
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-border">
              <th className="px-2 py-2 font-medium">المنتج</th>
              <th className="px-2 py-2 font-medium">مخزون تقديري</th>
              <th className="px-2 py-2 font-medium">سرعة البيع/يوم</th>
              <th className="px-2 py-2 font-medium">أيام للنفاد</th>
              <th className="px-2 py-2 font-medium">ربح القطعة</th>
              <th className="px-2 py-2 font-medium">القرار</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.product} className="border-b border-border/60 text-slate-200">
                <td className="px-2 py-2">{row.product}</td>
                <td className="px-2 py-2">{row.estimatedStock}</td>
                <td className="px-2 py-2">{row.dailyVelocity.toFixed(1)}</td>
                <td className="px-2 py-2">{row.daysUntilStockout ?? "—"}</td>
                <td className="px-2 py-2">{formatMoney(row.unitProfit, currency)}</td>
                <td className="px-2 py-2">
                  <Badge tone={DECISION[row.decision].tone}>{DECISION[row.decision].label}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
