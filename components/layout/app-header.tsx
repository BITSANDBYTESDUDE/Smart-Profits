"use client";

import { Bell, CalendarDays, CloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageFlow } from "@/components/layout/page-flow";
import { useAnalysis } from "@/context/analysis-context";
import { useAuth } from "@/context/auth-context";
import { ARABIC_MONTHS } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";
import { cn } from "@/lib/utils";

const CURRENCIES: CurrencyCode[] = ["SAR", "USD", "AED", "JOD", "ILS"];

export function AppHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const { user } = useAuth();
  const {
    currency,
    setCurrency,
    result,
    settings,
    parseResult,
    actionLog,
    files,
    activeFileId,
    selectFile,
  } = useAnalysis();
  const router = useRouter();
  const latest = result?.monthlySeries.at(-1);
  const heading = title ?? `مرحباً بك يا ${settings.storeName || user?.storeName || "متجر التاجر"}`;
  const description = subtitle ?? "نظرة عامة على أداء متجرك اليوم";
  const initial = (user?.fullName || settings.ownerName || "أ").slice(0, 1);
  const hasHighAlert = Boolean(result?.forecast.alerts.some((alert) => alert.severity === "high"));
  const dateLabel = latest ? `${ARABIC_MONTHS[latest.month]} ${latest.year}` : "—";

  return (
    <header className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{heading}</h1>
          <p className="mt-1 text-sm text-muted">
            {description}
            {parseResult ? ` • الملف الحالي: ${parseResult.fileName}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {files.length > 0 && (
            <select
              aria-label="اختيار ملف من الأرشيف"
              className="h-10 max-w-[220px] truncate rounded-xl border border-border bg-white/5 px-3 text-sm text-white outline-none"
              value={activeFileId ?? ""}
              onChange={(event) => {
                selectFile(event.target.value);
                router.push("/data");
              }}
            >
              {files.map((file) => (
                <option key={file.id} value={file.id} className="bg-[#0f172a] text-white">
                  {file.isDemo ? `تجريبي — ${file.fileName}` : file.fileName}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-xl border border-border bg-white/5 p-1 text-xs">
            {CURRENCIES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition",
                  currency === code ? "bg-primary text-white" : "text-slate-400 hover:text-white",
                )}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2 text-sm text-slate-300 md:flex">
            <CalendarDays className="h-4 w-4" />
            {dateLabel}
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-slate-300 hover:bg-white/5"
            aria-label="سجل الإجراءات"
            onClick={() => router.push("/settings?tab=actions")}
          >
            <Bell className="h-4 w-4" />
            {actionLog.length > 0 ? (
              <span className="absolute -top-1 -start-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white">
                {actionLog.length}
              </span>
            ) : hasHighAlert ? (
              <span className="absolute start-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            ) : null}
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-sm font-semibold text-white">
            {initial}
          </div>

          <Button variant="outline" onClick={() => router.push("/data?tab=archive")}>
            الأرشيف
          </Button>
          <Button onClick={() => router.push("/data?new=1")}>
            <CloudUpload className="h-4 w-4" />
            رفع ملف جديد
          </Button>
        </div>
      </div>
      <PageFlow />
    </header>
  );
}
