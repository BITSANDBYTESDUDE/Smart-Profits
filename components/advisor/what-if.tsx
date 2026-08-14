"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/analysis-context";
import { dataSpanDays, simulateWhatIf } from "@/lib/advisor";
import { formatMoney } from "@/lib/format";

export function WhatIfSimulator() {
  const { result, parseResult, currency } = useAnalysis();
  const catalog = result?.productHighlights.catalog ?? [];
  const [product, setProduct] = useState(catalog[0]?.name ?? "");
  const [mode, setMode] = useState<"price" | "discount">("price");
  const [price, setPrice] = useState(catalog[0] ? Math.round((catalog[0].revenue / Math.max(1, catalog[0].quantity)) * 100) / 100 : 0);
  const [discount, setDiscount] = useState(10);

  const selected = catalog.find((item) => item.name === product) ?? catalog[0];
  const days = parseResult ? dataSpanDays(parseResult.transactions) : 30;

  const simulation = useMemo(() => {
    if (!selected) return null;
    const current = selected.quantity > 0 ? selected.revenue / selected.quantity : selected.revenue;
    const next = mode === "discount" ? current * (1 - discount / 100) : price;
    return simulateWhatIf(selected, next, days);
  }, [selected, mode, price, discount, days]);

  if (!result || !selected || !simulation) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">ارفع ملفاً فيه منتجات حتى تعمل محاكاة «ماذا لو».</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          ماذا لو؟ — جرّب القرار قبل التنفيذ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>المنتج</Label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              value={selected.name}
              onChange={(event) => {
                const item = catalog.find((row) => row.name === event.target.value);
                setProduct(event.target.value);
                if (item) setPrice(Math.round((item.revenue / Math.max(1, item.quantity)) * 100) / 100);
              }}
            >
              {catalog.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>نوع التجربة</Label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              value={mode}
              onChange={(event) => setMode(event.target.value as "price" | "discount")}
            >
              <option value="price">رفع / تعديل السعر</option>
              <option value="discount">خصم نسبة</option>
            </select>
          </div>
          {mode === "price" ? (
            <div>
              <Label>السعر الجديد</Label>
              <Input className="mt-1" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
            </div>
          ) : (
            <div>
              <Label>نسبة الخصم %</Label>
              <Input className="mt-1" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4 text-sm text-slate-300">
            <p>السعر الحالي: {formatMoney(simulation.currentPrice, currency)}</p>
            <p className="mt-1">السعر الجديد: {formatMoney(simulation.newPrice, currency)}</p>
            <p className="mt-1">ربح القطعة: {formatMoney(simulation.currentUnitProfit, currency)} → {formatMoney(simulation.newUnitProfit, currency)}</p>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent/8 p-4 text-sm">
            <p className="text-slate-300">الربح الشهري المتوقع</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatMoney(simulation.currentMonthlyProfit, currency)} → {formatMoney(simulation.newMonthlyProfit, currency)}
            </p>
            <p className={`mt-1 ${simulation.delta >= 0 ? "text-accent" : "text-red-300"}`}>
              الفرق: {simulation.delta >= 0 ? "+" : ""}
              {formatMoney(simulation.delta, currency)}
            </p>
          </div>
        </div>
        <p className="text-sm leading-7 text-slate-200">{simulation.verdict}</p>
        <Button variant="outline" onClick={() => setPrice(simulation.currentPrice)}>
          إعادة السعر الحالي
        </Button>
      </CardContent>
    </Card>
  );
}
