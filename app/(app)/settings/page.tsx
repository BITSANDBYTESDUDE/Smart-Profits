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
import { useAppearance } from "@/context/appearance";
import { exportMonthlyReport } from "@/lib/export-report";
import { formatMoney } from "@/lib/format";
import type { AppSettings, CurrencyCode } from "@/lib/types";

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, months } = useAppearance();
  const requested = searchParams.get("tab");
  const tab = requested === "actions" || requested === "reports" ? requested : "store";
  const { settings, saveSettings, result, currency, parseResult } = useAnalysis();
  const [form, setForm] = useState<AppSettings>(settings);
  const tabs = [
    { id: "store", label: t("settings.tab.store") },
    { id: "actions", label: t("settings.tab.actions") },
    { id: "reports", label: t("settings.tab.reports") },
  ];

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const reports = useMemo(() => {
    return (result?.monthlySeries ?? [])
      .slice()
      .reverse()
      .map((point) => ({
        title: `${t("settings.reportOf")} ${months[point.month]} ${point.year}`,
        profit: point.netProfit,
        key: point.key,
      }));
  }, [result, t, months]);

  function setTab(id: string) {
    router.replace(id === "store" ? "/settings" : `/settings?tab=${id}`);
  }

  function save() {
    saveSettings({ ...form, opexSetupCompleted: true });
    toast.success(t("settings.saved"));
  }

  function exportReport(monthKey: string, mode: "html" | "pdf", scope: "month" | "all" = "month") {
    if (!result || !parseResult) {
      toast.error(t("settings.needFile"));
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
      toast.success(mode === "pdf" ? t("settings.pdfOk") : t("settings.htmlOk"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.exportFail"));
    }
  }

  return (
    <>
      <AppHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <div className="space-y-5 p-6">
        <SectionTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "store" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.account")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("settings.storeName")}</Label>
                  <Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
                </div>
                <div>
                  <Label>{t("settings.currency")}</Label>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
                    value={form.defaultCurrency}
                    onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as CurrencyCode })}
                  >
                    <option value="SAR">{t("settings.sar")}</option>
                    <option value="USD">{t("settings.usd")}</option>
                    <option value="AED">{t("settings.aed")}</option>
                    <option value="JOD">{t("settings.jod")}</option>
                    <option value="ILS">{t("settings.ils")}</option>
                  </select>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t("settings.opexTitle")}</h3>
                <p className="mb-3 text-xs leading-6 text-muted">{t("settings.opexHint")}</p>
                <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-black/[0.03] p-3 dark:bg-white/3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-teal-400"
                    checked={Boolean(form.opexIncludedInFile)}
                    onChange={(e) => setForm({ ...form, opexIncludedInFile: e.target.checked, opexSetupCompleted: true })}
                  />
                  <span className="text-sm leading-6 text-foreground">{t("settings.noOpex")}</span>
                </label>
                <div className={form.opexIncludedInFile ? "pointer-events-none grid gap-4 opacity-40 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
                  <div>
                    <Label>{t("settings.rent")}</Label>
                    <Input type="number" min={0} value={form.rent} onChange={(e) => setForm({ ...form, rent: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>{t("settings.salaries")}</Label>
                    <Input type="number" min={0} value={form.salaries} onChange={(e) => setForm({ ...form, salaries: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>{t("settings.utilities")}</Label>
                    <Input type="number" min={0} value={form.utilities || 0} onChange={(e) => setForm({ ...form, utilities: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>{t("settings.other")}</Label>
                    <Input type="number" min={0} value={form.otherOpex} onChange={(e) => setForm({ ...form, otherOpex: Number(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
              <Button onClick={save}>{t("settings.save")}</Button>
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
              <p className="text-sm leading-7 text-muted">{t("settings.reportIntro")}</p>
              {reports[0] && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => exportReport(reports[0].key, "html", "all")}>
                    <Download className="h-4 w-4" />
                    {t("settings.downloadAll")}
                  </Button>
                  <Button variant="outline" onClick={() => exportReport(reports[0].key, "pdf", "all")}>
                    <Printer className="h-4 w-4" />
                    {t("settings.printPdf")}
                  </Button>
                </div>
              )}
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.monthReports")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reports.length === 0 && (
                  <p className="text-sm text-muted">{t("settings.noReports")}</p>
                )}
                {reports.map((report) => (
                  <div key={report.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-black/[0.03] px-4 py-3 dark:bg-white/3">
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
                        <p className="text-sm font-medium text-foreground">{report.title}</p>
                        <p className="text-xs text-muted">
                          {t("settings.netProfit")}: {formatMoney(report.profit, currency)} • {t("settings.fullReport")}
                        </p>
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

function SettingsFallback() {
  const { t } = useAppearance();
  return <p className="p-6 text-sm text-muted">{t("settings.loading")}</p>;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsPageInner />
    </Suspense>
  );
}
