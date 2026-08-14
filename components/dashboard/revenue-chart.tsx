"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { convertAmount, formatMoney } from "@/lib/format";

export function RevenueExpenseChart() {
  const { result, currency } = useAnalysis();
  if (!result) return null;

  const data = result.monthlySeries.map((point) => ({
    name: point.label.replace(/ \d{4}$/, ""),
    revenue: Math.round(convertAmount(point.revenue, currency)),
    expenses: Math.round(convertAmount(point.expenses, currency)),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>الإيرادات مقابل المصروفات</CardTitle>
        <div className="flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-accent" /> الإيرادات الفعلية
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-slate-400" /> المصروفات
          </span>
        </div>
      </CardHeader>
      <CardContent className="h-[280px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
              formatter={(value) => formatMoney(currency === "USD" ? Number(value) * 3.75 : Number(value), currency)}
            />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="expenses" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
