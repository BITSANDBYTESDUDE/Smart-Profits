"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { convertAmount, formatMoney } from "@/lib/format";

export function SalesBarChart() {
  const { result, currency } = useAnalysis();
  if (!result) return null;

  const history = result.monthlySeries.map((point) => ({
    name: point.label.replace(/ \d{4}$/, ""),
    sales: Math.round(convertAmount(point.revenue, currency)),
    expenses: Math.round(convertAmount(point.expenses, currency)),
    ai: false,
  }));

  const next = result.forecast.series.find((p) => p.isForecast);
  if (next) {
    history.push({
      name: next.label.replace(" (توقع)", ""),
      sales: Math.round(convertAmount(next.predictedRevenue ?? 0, currency)),
      expenses: Math.round(convertAmount(next.predictedExpenses ?? 0, currency)),
      ai: true,
    });
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>المبيعات والمصروفات</CardTitle>
        <Badge tone="info">ذكاء اصطناعي</Badge>
      </CardHeader>
      <CardContent className="h-[280px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={history}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
              formatter={(value) => formatMoney(currency === "USD" ? Number(value) * 3.75 : Number(value), currency)}
            />
            <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#475569" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
