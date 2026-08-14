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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { convertAmount, formatMoney } from "@/lib/format";

export function ForecastChart() {
  const { result, currency } = useAnalysis();
  if (!result) return null;

  const data = result.forecast.series.map((point) => ({
    name: point.label,
    actual: point.isForecast ? undefined : Math.round(convertAmount(point.actualRevenue ?? 0, currency)),
    forecast: Math.round(convertAmount(point.predictedRevenue ?? 0, currency)),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>مسار الإيرادات المتوقع</CardTitle>
        <Badge tone="info">تحليلات AI</Badge>
      </CardHeader>
      <CardContent className="h-[320px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
              formatter={(value) => formatMoney(currency === "USD" ? Number(value) * 3.75 : Number(value), currency)}
            />
            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#60a5fa" strokeWidth={2} strokeDasharray="7 6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
