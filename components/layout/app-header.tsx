"use client";

import { Bell, CalendarDays, CloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageFlow } from "@/components/layout/page-flow";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { useAuth } from "@/context/auth-context";
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
  const { t, months } = useAppearance();
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
  const store = settings.storeName || user?.storeName || "";
  const heading = title ?? `${t("header.welcome")} ${store}`.trim();
  const description = subtitle ?? t("header.overview");
  const initial = (user?.fullName || settings.ownerName || "S").slice(0, 1);
  const hasHighAlert = Boolean(result?.forecast.alerts.some((alert) => alert.severity === "high"));
  const dateLabel = latest ? `${months[latest.month]} ${latest.year}` : "—";

  return (
    <header className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{heading}</h1>
          <p className="mt-1 text-sm text-muted">
            {description}
            {parseResult ? ` • ${t("header.currentFile")}: ${parseResult.fileName}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {files.length > 0 && (
            <select
              aria-label={t("header.pickFile")}
              className="h-10 max-w-[220px] truncate rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              value={activeFileId ?? ""}
              onChange={(event) => {
                selectFile(event.target.value);
                router.push("/data");
              }}
            >
              {files.map((file) => (
                <option key={file.id} value={file.id} className="bg-card text-foreground">
                  {file.isDemo ? `${t("header.demo")} — ${file.fileName}` : file.fileName}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-xl border border-border bg-background p-1 text-xs">
            {CURRENCIES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition",
                  currency === code ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted md:flex">
            <CalendarDays className="h-4 w-4" />
            {dateLabel}
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:bg-black/5 dark:hover:bg-white/5"
            aria-label={t("settings.tab.actions")}
            onClick={() => router.push("/settings?tab=actions")}
          >
            <Bell className="h-4 w-4" />
            {actionLog.length > 0 ? (
              <span className="absolute -top-1 -start-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-slate-950">
                {actionLog.length}
              </span>
            ) : hasHighAlert ? (
              <span className="absolute start-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            ) : null}
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-slate-950">
            {initial}
          </div>

          <Button variant="outline" onClick={() => router.push("/data?tab=archive")}>
            {t("header.archive")}
          </Button>
          <Button onClick={() => router.push("/data?new=1")}>
            <CloudUpload className="h-4 w-4" />
            {t("header.upload")}
          </Button>
        </div>
      </div>
      <PageFlow />
    </header>
  );
}
