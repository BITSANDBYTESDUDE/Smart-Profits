"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, Ghost, Pencil, Scale, ShieldCheck } from "lucide-react";
import { OpexSetupModal } from "@/components/opex/opex-setup-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney, monthKey } from "@/lib/format";
import { computeBreakEven, computeOpexHealth, computeRealVsPhantom, monthlyOpexFromSettings } from "@/lib/opex";
import type { AppSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OpexInsights() {
  const { result, parseResult, settings, currency, saveSettings } = useAnalysis();
  const [setupOpen, setSetupOpen] = useState(false);
  const latest = result?.monthlySeries.at(-1);
  const txs = useMemo(() => {
    const all = parseResult?.transactions ?? [];
    if (!latest) return all;
    const dated = all.filter((tx) => tx.date);
    if (!dated.length) return all;
    return dated.filter((tx) => monthKey(tx.date!.getFullYear(), tx.date!.getMonth()) === latest.key);
  }, [parseResult?.transactions, latest?.key]);

  const phantom = useMemo(() => computeRealVsPhantom(latest, settings), [latest, settings]);
  const breakEven = useMemo(() => computeBreakEven(latest, txs, settings), [latest, txs, settings]);
  const health = useMemo(() => computeOpexHealth(latest, settings), [latest, settings]);

  if (!result || !phantom || !breakEven || !health) return null;

  const toneClass =
    health.tone === "bad"
      ? "border-red-500/40 bg-red-500/10"
      : health.tone === "warn"
        ? "border-amber-400/40 bg-amber-400/10"
        : health.tone === "good"
          ? "border-primary/30 bg-primary/8"
          : "border-primary/30 bg-primary/8";

  function saveOpex(next: AppSettings) {
    saveSettings(next);
    setSetupOpen(false);
  }

  return (
    <>
      {!settings.opexSetupCompleted && (
        <Card className="border-amber-400/30 bg-amber-400/8 p-5">
          <p className="text-sm font-semibold text-amber-100">صافي الربح قد يكون وهمياً</p>
          <p className="mt-1 text-sm leading-7 text-slate-300">
            ملف المبيعات لا يتضمن عادةً الإيجار والرواتب والفواتير. أكّد مصاريفك الثابتة لنحسب الربح الحقيقي ونقطة التعادل.
          </p>
          <Button className="mt-3" onClick={() => setSetupOpen(true)}>
            إدخال المصاريف الثابتة الآن
          </Button>
        </Card>
      )}

      <Card className={cn("p-5", toneClass)}>
        <div className="flex items-start gap-3">
          {health.tone === "bad" ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
          ) : health.tone === "good" ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-foreground">{health.title}</p>
              <p className="text-sm text-slate-200">
                نسبة التشغيل: <span className="font-bold">{health.ratioPct.toFixed(0)}%</span> من المبيعات
              </p>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-200">{health.message}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              الربح الحقيقي مقابل الربح الوهمي
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setSetupOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              تعديل الثوابت
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4">
                <p className="flex items-center gap-1.5 text-xs text-amber-200">
                  <Ghost className="h-3.5 w-3.5" />
                  الربح الظاهري (من الملف)
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatMoney(phantom.phantomProfit, currency)}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">المبيعات − تكلفة البضاعة فقط. هذا ربح البضاعة لا ربح المتجر.</p>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4">
                <p className="text-xs text-primary">الربح الحقيقي (بعد الثوابت)</p>
                <p className={cn("mt-2 text-2xl font-bold", phantom.realProfit >= 0 ? "text-accent" : "text-danger")}>
                  {formatMoney(phantom.realProfit, currency)}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  بعد خصم إيجار {formatMoney(settings.opexIncludedInFile ? 0 : settings.rent, currency)} + رواتب{" "}
                  {formatMoney(settings.opexIncludedInFile ? 0 : settings.salaries, currency)} + فواتير{" "}
                  {formatMoney(settings.opexIncludedInFile ? 0 : settings.utilities || 0, currency)} + تسويق{" "}
                  {formatMoney(settings.opexIncludedInFile ? 0 : settings.otherOpex, currency)}.
                </p>
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-300">
              الفرق بين الرقمين:{" "}
              <span className="font-semibold text-foreground">{formatMoney(phantom.gap, currency)}</span>
              {phantom.gap > 0
                ? " — هذا ما يأكله التشغيل الثابت والمتغير من ربح البضاعة. إن لم تُدخل الثوابت سيبدو المتجر أكثر ربحاً مما هو عليه."
                : " — لا توجد مصاريف ثابتة محتسبة حالياً."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              نقطة التعادل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakEven.fixedOpex <= 0 ? (
              <p className="text-sm leading-7 text-slate-300">
                أدخل مصاريفك الثابتة لنحسب كم قطعة يجب أن تبيع هذا الشهر لتغطية الإيجار والرواتب قبل أي ربح صافٍ.
              </p>
            ) : breakEven.impossible ? (
              <p className="text-sm leading-7 text-red-200">
                متوسط ربح القطعة صفر أو سالب. لا يمكن تغطية مصاريف ثابتة قدرها {formatMoney(breakEven.fixedOpex, currency)}{" "}
                قبل إصلاح التسعير أو التكلفة.
              </p>
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {breakEven.unitsNeeded?.toLocaleString("en-US")} <span className="text-lg font-medium text-slate-400">قطعة</span>
                </p>
                <p className="text-sm leading-7 text-slate-200">
                  أنت بحاجة لبيع <span className="font-semibold text-foreground">{breakEven.unitsNeeded}</span> قطعة هذا الشهر
                  فقط لتغطية إيجارك ورواتبك وفواتيرك (
                  {formatMoney(monthlyOpexFromSettings(settings), currency)}) قبل أن تبدأ بتحقيق ربح صافٍ لك.
                </p>
                <p className="text-sm text-slate-400">
                  بعت حتى الآن {breakEven.unitsSold.toLocaleString("en-US")} قطعة
                  {breakEven.covered
                    ? " — تجاوزت نقطة التعادل."
                    : ` — يتبقى ${breakEven.remainingUnits.toLocaleString("en-US")} قطعة.`}
                  {breakEven.revenueNeeded
                    ? ` • أو مبيعات بنحو ${formatMoney(breakEven.revenueNeeded, currency)}.`
                    : ""}
                </p>
                <p className="text-xs text-muted">
                  متوسط مساهمة القطعة: {formatMoney(breakEven.avgUnitContribution, currency)} • هامش البضاعة{" "}
                  {breakEven.grossMarginPct.toFixed(0)}%
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <OpexSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onConfirm={saveOpex}
        confirmLabel="حفظ وإعادة حساب الربح الحقيقي"
      />
    </>
  );
}
