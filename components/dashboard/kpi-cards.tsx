"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Receipt, Shield, TrendingUp, Wallet, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

function Trend({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", positive ? "text-accent" : "text-danger")}>
      <Icon className="h-3.5 w-3.5" />
      {formatPct(value)}
    </span>
  );
}

export function HealthRing({ score, label }: { score: number; label: string }) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const stroke = score >= 75 ? "#4fd1c5" : score >= 50 ? "#e8c56b" : "#ef4444";

  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-accent">{label}</span>
      </div>
    </div>
  );
}

export function KpiCards() {
  const { result, currency } = useAnalysis();
  const [open, setOpen] = useState<"revenue" | "expenses" | "profit" | null>(null);
  if (!result) return null;
  const { kpis } = result;

  const items = [
    {
      key: "revenue" as const,
      title: "إجمالي المبيعات",
      value: formatMoney(kpis.totalRevenue, currency),
      hint: "اضغط لمعرفة المصدر",
      trend: kpis.revenueChangePct,
      icon: Wallet,
    },
    {
      key: "expenses" as const,
      title: "إجمالي المصروفات",
      value: formatMoney(kpis.totalExpenses, currency),
      hint: "تكلفة + تشغيل",
      trend: kpis.expenseChangePct,
      icon: Receipt,
    },
    {
      key: "profit" as const,
      title: "صافي الربح",
      value: formatMoney(kpis.netProfit, currency),
      hint: `هامش ${kpis.profitMargin.toFixed(1)}% — اضغط للتفسير`,
      trend: kpis.profitChangePct,
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted">مؤشر صحة المتجر</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{kpis.healthScore}</p>
            <p className="mt-1 text-sm text-accent">{kpis.healthLabel}</p>
          </div>
          <HealthRing score={kpis.healthScore} label={kpis.healthLabel} />
        </Card>

        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" className="text-start" onClick={() => setOpen(item.key)}>
              <Card className="relative h-full overflow-hidden p-5 transition hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-muted">{item.title}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{item.value}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{item.hint}</span>
                  <Trend value={item.trend} />
                </div>
                <Shield className="pointer-events-none absolute -end-4 -bottom-4 h-20 w-20 text-foreground/3" />
              </Card>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(null)}>
          <Card className="w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-foreground">كيف وصلنا لهذا الرقم؟</p>
              <Button size="icon" variant="ghost" onClick={() => setOpen(null)}>
                <X />
              </Button>
            </div>
            <div className="space-y-2 font-mono text-sm text-slate-200">
              <p className="flex justify-between"><span>المبيعات</span><span>{formatMoney(kpis.totalRevenue, currency)}</span></p>
              <p className="flex justify-between"><span>- تكلفة المبيعات / خامات</span><span>{formatMoney(kpis.totalCogs, currency)}</span></p>
              <p className="flex justify-between"><span>- تشغيل</span><span>{formatMoney(kpis.totalOpex, currency)}</span></p>
              <p className="flex justify-between"><span>- رواتب من الملف</span><span>{formatMoney(kpis.totalSalaries, currency)}</span></p>
              <p className="flex justify-between"><span>- تالف وهالك</span><span>{formatMoney(kpis.totalWaste, currency)}</span></p>
              <p className="border-t border-border pt-2 flex justify-between text-accent">
                <span>صافي الربح</span>
                <span>{formatMoney(kpis.netProfit, currency)}</span>
              </p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {open === "profit"
                ? "صافي الربح = المبيعات فقط − (خامات + تشغيل + رواتب + تالف). الإيجار والرواتب في الإعدادات تُضاف إن لم تكن داخل الملف. بنود مثل الإيجار والكهرباء لا تُحسب مبيعات."
                : open === "expenses"
                  ? "المصروف يجمع تكلفة المبيعات/الخامات + التشغيل + الرواتب + التالف، عبر كل أشهر الملف."
                  : "المبيعات تُحسب فقط من الصفوف المصنّفة إيراد/بيع بالعربي أو الإنجليزي. المصروف والرواتب لا تدخل هنا."}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
