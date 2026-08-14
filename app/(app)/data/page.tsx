"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileDropzone } from "@/components/dashboard/file-dropzone";
import { FileStudyReport } from "@/components/analysis/file-study-report";
import { ProductSalesTable } from "@/components/analysis/product-sales-table";
import { FileArchiveCards } from "@/components/layout/file-archive";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTabs } from "@/components/ui/section-tabs";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { SAMPLE_CSV_TEMPLATE, SAMPLE_CSV_TEMPLATE_EN } from "@/lib/sample-data";

function DataPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useAppearance();
  const tab = searchParams.get("tab") === "archive" ? "archive" : "upload";
  const wantsNewUpload = searchParams.get("new") === "1";
  const { parseResult, isProcessing, error, resetToDemo, files } = useAnalysis();
  const tabs = [
    { id: "upload", label: t("data.tab.upload") },
    { id: "archive", label: t("data.tab.archive") },
  ];
  const uploadedCount = files.filter((file) => !file.isDemo).length;
  const hasAnalysis = Boolean(parseResult);
  const showDropzone = tab === "upload" && (wantsNewUpload || !hasAnalysis);

  function setTab(id: string) {
    router.replace(id === "archive" ? "/data?tab=archive" : "/data");
  }

  function downloadTemplate() {
    const csv = locale === "en" ? SAMPLE_CSV_TEMPLATE_EN : SAMPLE_CSV_TEMPLATE;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = locale === "en" ? "smartprofit-template-en.csv" : "smartprofit-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AppHeader title={t("data.title")} subtitle={t("data.subtitle")} />
      <div className="space-y-5 p-6">
        <SectionTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "upload" ? (
          <>
            {showDropzone && (
              <>
                <FileDropzone
                  compact={hasAnalysis}
                  redirectToAnalysis={false}
                  title={isProcessing ? t("data.studying") : t("data.drop")}
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={downloadTemplate}>
                    {t("data.template")}
                  </Button>
                  <Button variant="ghost" onClick={resetToDemo}>
                    {t("data.restoreDemo")}
                  </Button>
                </div>
              </>
            )}
            {error && <Card className="border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</Card>}
            <FileStudyReport />
            <ProductSalesTable />
          </>
        ) : (
          <>
            <Card className="border-primary/30 bg-primary/8 p-5">
              <h2 className="text-lg font-semibold text-foreground">
                {t("data.saved")}: {uploadedCount}
              </h2>
              <p className="mt-1 text-sm leading-7 text-muted">{t("data.savedHint")}</p>
            </Card>
            <FileArchiveCards />
          </>
        )}
      </div>
    </>
  );
}

function DataFallback() {
  const { t } = useAppearance();
  return <p className="p-6 text-sm text-muted">{t("data.loading")}</p>;
}

export default function DataPage() {
  return (
    <Suspense fallback={<DataFallback />}>
      <DataPageInner />
    </Suspense>
  );
}
