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
import { SAMPLE_CSV_TEMPLATE } from "@/lib/sample-data";

const TABS = [
  { id: "upload", label: "الرفع والمعالجة" },
  { id: "archive", label: "الأرشيف" },
];

function DataPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "archive" ? "archive" : "upload";
  const wantsNewUpload = searchParams.get("new") === "1";
  const { parseResult, isProcessing, error, resetToDemo, files } = useAnalysis();
  const uploadedCount = files.filter((file) => !file.isDemo).length;
  const hasAnalysis = Boolean(parseResult);
  const showDropzone = tab === "upload" && (wantsNewUpload || !hasAnalysis);

  function setTab(id: string) {
    router.replace(id === "archive" ? "/data?tab=archive" : "/data");
  }

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + SAMPLE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartprofit-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AppHeader
        title="إدارة الملفات والبيانات"
        subtitle="رفع، تنظيف Messy Excel، وأرشيف الملفات في تدفق واحد"
      />
      <div className="space-y-5 p-6">
        <SectionTabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === "upload" ? (
          <>
            {showDropzone && (
              <>
                <FileDropzone
                  compact={hasAnalysis}
                  redirectToAnalysis={false}
                  title={isProcessing ? "جاري دراسة الأعمدة وتنظيف الملف..." : "اسحب Excel أو CSV أو PDF أو صورة هنا"}
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={downloadTemplate}>
                    تحميل قالب البيانات
                  </Button>
                  <Button variant="ghost" onClick={resetToDemo}>
                    استعادة البيانات التجريبية
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
              <h2 className="text-lg font-semibold text-white">ملفاتك المحفوظة: {uploadedCount}</h2>
              <p className="mt-1 text-sm leading-7 text-slate-300">
                اضغط «فتح التحليل» لأي ملف. التشخيص والمحاكاة والتقارير تتحول كلها إلى بياناته.
              </p>
            </Card>
            <FileArchiveCards />
          </>
        )}
      </div>
    </>
  );
}

export default function DataPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">جاري تحميل الملفات...</p>}>
      <DataPageInner />
    </Suspense>
  );
}
