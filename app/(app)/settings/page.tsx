"use client";

import { Download, FileText, Printer } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ActionLogHint, ActionLogList } from "@/components/layout/action-log";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTabs } from "@/components/ui/section-tabs";
import { useAnalysis } from "@/context/analysis-context";
import { exportMonthlyReport } from "@/lib/export-report";
import { ARABIC_MONTHS, formatMoney } from "@/lib/format";
import type { AppSettings, CurrencyCode } from "@/lib/types";

const TABS = [
  { id: "store", label: "إعدادات المتجر" },
  { id: "actions", label: "سجل الإجراءات" },
  { id: "reports", label: "تحميل التقارير" },
];

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const tab = requested === "actions" || requested === "reports" ? requested : "store";
  const { settings, saveSettings, result, currency, parseResult } = useAnalysis();
  const [form, setForm] = useState<AppSettings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const reports = useMemo(() => {
    return (result?.monthlySeries ?? [])
      .slice()
      .reverse()
      .map((point) => ({
        title: `تقرير ${ARABIC_MONTHS[point.month]} ${point.year}`,
        profit: point.netProfit,
        key: point.key,
      }));
  }, [result]);

  function setTab(id: string) {
    router.replace(id === "store" ? "/settings" : `/settings?tab=${id}`);
  }

  function save() {
    saveSettings({ ...form, opexSetupCompleted: true });
    toast.success("تم حفظ التغييرات وإعادة حساب صافي الربح.");
  }

  function exportReport(monthKey: string, mode: "html" | "pdf", scope: "month" | "all" = "month") {
    if (!result || !parseResult) {
      toast.error("ارفع ملفاً أولاً حتى يُبنى التقرير.");
      return;
    }
    try {
      exportMonthlyReport(
        {
          monthKey,
          result,
          settings,
          currency,
          transactions: parseResult.transactions,
          storeName: settings.storeName,
          scope,
        },
        mode,
      );
      toast.success(mode === "pdf" ? "افتح نافذة الطباعة واحفظ التقرير PDF." : "تم تنزيل التقرير HTML الكامل.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تصدير التقرير.");
    }
  }

  return (
    <>
      <AppHeader
        title="التقارير والإعدادات"
        subtitle="إعدادات المتجر، سجل الإجراءات المطبقة، وتصدير التقارير الشهرية"
      />
      <div className="space-y-5 p-6">
        <SectionTabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === "store" && (
          <Card>
            <CardHeader>
              <CardTitle>إدارة الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>اسم المتجر</Label>
                  <Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
                </div>
                <div>
                  <Label>العملة الافتراضية</Label>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-[#0f172a]/80 px-3 text-sm text-white outline-none"
                    value={form.defaultCurrency}
                    onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as CurrencyCode })}
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="JOD">دينار أردني (JOD)</option>
                    <option value="ILS">شيكل (₪)</option>
                  </select>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">المصاريف الثابتة الشهرية</h3>
                <p className="mb-3 text-xs leading-6 text-muted">
                  ملف المبيعات نادراً ما يحتوي الإيجار والرواتب والفواتير. أدخلها هنا ليُحسب صافي الربح الحقيقي لا ربح البضاعة فقط.
                </p>
                <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white/3 p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-emerald-500"
                    checked={Boolean(form.opexIncludedInFile)}
                    onChange={(e) => setForm({ ...form, opexIncludedInFile: e.target.checked, opexSetupCompleted: true })}
                  />
                  <span className="text-sm leading-6 text-slate-200">
                    لا توجد لدي مصاريف ثابتة / تم تضمينها داخل الملف
                  </span>
                </label>
                <div className={form.opexIncludedInFile ? "pointer-events-none grid gap-4 opacity-40 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
                  <div>
                    <Label>إيجار المقر / المستودع</Label>
                    <Input type="number" min={0} value={form.rent} onChange={(e) => setForm({ ...form, rent: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>رواتب الموظفين والعمالة</Label>
                    <Input type="number" min={0} value={form.salaries} onChange={(e) => setForm({ ...form, salaries: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>الفواتير والخدمات (كهرباء، ماء، إنترنت)</Label>
                    <Input type="number" min={0} value={form.utilities || 0} onChange={(e) => setForm({ ...form, utilities: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>تسويق أو اشتراكات ثابتة</Label>
                    <Input type="number" min={0} value={form.otherOpex} onChange={(e) => setForm({ ...form, otherOpex: Number(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
              <Button onClick={save}>حفظ التغييرات</Button>
            </CardContent>
          </Card>
        )}

        {tab === "actions" && (
          <>
            <ActionLogList />
            <ActionLogHint />
          </>
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/8 p-5">
              <p className="text-sm leading-7 text-slate-200">
                التقرير الكامل يتضمن ترويسة المتجر، تفكيك المبيعات والتكلفة والمصاريف، مقارنة الأشهر، أعلى سعر بيع، المنتجات الرابحة والخاسرة، تسريب الربح، المخزون، و3 قرارات لليوم. حمّلي HTML أو احفظي PDF من نافذة الطباعة.
              </p>
              {reports[0] && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => exportReport(reports[0].key, "html", "all")}>
                    <Download className="h-4 w-4" />
                    تحميل التقرير الشامل HTML
                  </Button>
                  <Button variant="outline" onClick={() => exportReport(reports[0].key, "pdf", "all")}>
                    <Printer className="h-4 w-4" />
                    طباعة / حفظ PDF
                  </Button>
                </div>
              )}
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>تقارير الأشهر للملف المفتوح</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reports.length === 0 && (
                  <p className="text-sm text-muted">لا توجد تقارير بعد. ارفع ملفاً من إدارة البيانات ثم عد إلى هنا.</p>
                )}
                {reports.map((report) => (
                  <div key={report.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/3 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportReport(report.key, "html")}>
                        <Download className="h-4 w-4" />
                        HTML
                      </Button>
                      <Button size="sm" onClick={() => exportReport(report.key, "pdf")}>
                        <Printer className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-3">
                      <div className="text-end">
                        <p className="text-sm font-medium text-white">{report.title}</p>
                        <p className="text-xs text-muted">صافي الربح: {formatMoney(report.profit, currency)} • تقرير تفصيلي كامل</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">جاري تحميل الإعدادات...</p>}>
      <SettingsPageInner />
    </Suspense>
  );
}
