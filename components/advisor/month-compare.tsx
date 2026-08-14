"use client";

import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MonthCompare() {
  const { result, currency } = useAnalysis();
  if (!result) return null;
  const points = result.monthlySeries;
  if (points.length < 2) return null;

  const ranked = [...points].sort((a, b) => b.netProfit - a.netProfit);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  function reason(index: number) {
    const current = points[index];
    const previous = index > 0 ? points[index - 1] : null;
    if (!previous) return "أول فترة في الملف.";
    const rev = current.revenue - previous.revenue;
    const cost = current.expenses - previous.expenses;
    if (cost > 0 && cost >= Math.abs(rev)) {
      return "السبب الأوضح: ارتفاع التكلفة أو مصاريف التشغيل (شحن/إعلانات) أكثر من تغير المبيعات.";
    }
    if (rev < 0) return "السبب الأوضح: انخفاض حجم الطلب/المبيعات مقارنة بالفترة السابقة.";
    if (rev > 0 && current.netProfit > previous.netProfit) return "المبيعات ارتفعت مع بقاء التكلفة تحت السيطرة.";
    return "الربح تغيّر بسبب مزيج المبيعات والتكلفة معاً.";
  }

  const bestIdx = points.findIndex((point) => point.key === best.key);
  const worstIdx = points.findIndex((point) => point.key === worst.key);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          مقارنة الأشهر والأيام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-accent/30 bg-accent/8 p-4">
            <p className="text-xs text-muted">الأكثر ربحية</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{best.label}</p>
            <p className="mt-1 text-sm text-accent">{formatMoney(best.netProfit, currency)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{reason(bestIdx)}</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4">
            <p className="text-xs text-muted">الأقل ربحية</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{worst.label}</p>
            <p className="mt-1 text-sm text-red-300">{formatMoney(worst.netProfit, currency)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{reason(worstIdx)}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-start font-medium">الفترة</th>
                <th className="px-2 py-2 text-start font-medium">المبيعات</th>
                <th className="px-2 py-2 text-start font-medium">المصروف</th>
                <th className="px-2 py-2 text-start font-medium">صافي الربح</th>
                <th className="px-2 py-2 text-start font-medium">التغيّر</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => {
                const prev = index > 0 ? points[index - 1] : null;
                const delta = prev ? point.netProfit - prev.netProfit : 0;
                return (
                  <tr key={point.key} className="border-b border-border/70">
                    <td className="px-2 py-2 text-foreground">{point.label}</td>
                    <td className="px-2 py-2 text-slate-300">{formatMoney(point.revenue, currency)}</td>
                    <td className="px-2 py-2 text-slate-300">{formatMoney(point.expenses, currency)}</td>
                    <td className="px-2 py-2 text-foreground">{formatMoney(point.netProfit, currency)}</td>
                    <td className={cn("px-2 py-2", !prev ? "text-muted" : delta >= 0 ? "text-accent" : "text-danger")}>
                      {!prev ? "—" : `${delta >= 0 ? "+" : ""}${formatMoney(delta, currency)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
