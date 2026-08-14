"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney } from "@/lib/format";

export function ExpenseDonut() {
  const { result, currency } = useAnalysis();
  if (!result) return null;
  const data = result.expenseBreakdown;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>تصنيف المصروفات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-[210px] w-[210px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={3}>
                {data.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                formatter={(value) => formatMoney(Number(value), currency)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted">الإجمالي</span>
            <span className="text-lg font-bold text-foreground">{formatMoney(total, currency, { compact: true })}</span>
          </div>
        </div>
        <ul className="mt-2 space-y-2">
          {data.map((slice) => (
            <li key={slice.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <i className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                {slice.name}
              </span>
              <span className="text-muted">{formatMoney(slice.value, currency, { compact: true })}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
