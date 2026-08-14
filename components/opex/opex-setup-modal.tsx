"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/analysis-context";
import { currencySuffix, formatMoney } from "@/lib/format";
import { monthlyOpexFromSettings } from "@/lib/opex";
import type { AppSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const FIELDS: Array<{
  key: "rent" | "salaries" | "utilities" | "otherOpex";
  label: string;
  hint: string;
}> = [
  { key: "rent", label: "إيجار المقر / المستودع (إن وجد)", hint: "اتركه 0 إن كنت تعمل من المنزل" },
  { key: "salaries", label: "رواتب الموظفين والعمالة", hint: "صافي ما تدفعه شهرياً للفريق" },
  { key: "utilities", label: "الفواتير والخدمات", hint: "كهرباء، ماء، إنترنت، تكييف" },
  { key: "otherOpex", label: "تسويق أو اشتراكات ثابتة", hint: "إعلانات شهرية، برامج، توصيل ثابت" },
];

export function OpexSetupModal({
  open,
  onClose,
  onConfirm,
  onSkip,
  confirmLabel = "متابعة لرفع الملف",
  skipLabel = "لاحقاً",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (next: AppSettings) => void;
  onSkip?: () => void;
  confirmLabel?: string;
  skipLabel?: string;
}) {
  const { settings, currency } = useAnalysis();
  const [form, setForm] = useState(settings);
  const [included, setIncluded] = useState(Boolean(settings.opexIncludedInFile));
  const suffix = currencySuffix(currency);

  useEffect(() => {
    if (!open) return;
    setForm(settings);
    setIncluded(Boolean(settings.opexIncludedInFile));
  }, [open, settings]);

  if (!open) return null;

  const preview = monthlyOpexFromSettings({ ...form, opexIncludedInFile: included });

  function submit() {
    onConfirm({
      ...form,
      opexIncludedInFile: included,
      opexSetupCompleted: true,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-400/20 bg-[#0b1220] p-5 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-300">تنبيه المستشار المالي قبل التحليل</p>
              <h2 className="mt-1 text-lg font-semibold text-white">تجهيز مالي سريع</h2>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="إغلاق">
            <X />
          </Button>
        </div>

        <p className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm leading-7 text-slate-200">
          للحصول على <span className="font-semibold text-white">صافي ربح دقيق 100%</span> لمتجرك، نحتاج لاحتساب
          المصاريف الشهرية الثابتة التي لا تظهر عادةً في ملفات المبيعات (مثل الإيجار، الرواتب، والخدمات). بدونها يظهر
          ربح البضاعة فقط — ربح وهمي.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-white/3 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-emerald-500"
            checked={included}
            onChange={(event) => setIncluded(event.target.checked)}
          />
          <span className="text-sm leading-6 text-slate-200">
            لا توجد لدي مصاريف ثابتة / تم تضمينها داخل الملف
            <span className="mt-0.5 block text-xs text-muted">تخطي الإضافة الخارجية واعتماد أرقام الملف كما هي</span>
          </span>
        </label>

        <div className={cn("mt-4 grid gap-3", included && "pointer-events-none opacity-40")}>
          {FIELDS.map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step={50}
                  className="pe-24"
                  value={form[field.key] || 0}
                  onChange={(event) =>
                    setForm({ ...form, [field.key]: Math.max(0, Number(event.target.value) || 0) })
                  }
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {suffix} / شهرياً
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted">{field.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm">
          <span className="text-slate-300">إجمالي الثوابت المحتسبة</span>
          <span className="font-semibold text-white">{included ? "من الملف فقط" : formatMoney(preview, currency)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="flex-1" onClick={submit}>
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={onSkip ?? onClose}>
            {skipLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
