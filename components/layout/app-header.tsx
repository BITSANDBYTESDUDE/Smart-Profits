"use client";

import { Bell, CalendarDays, CloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageFlow } from "@/components/layout/page-flow";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { useAuth } from "@/context/auth-context";
import { monthKey } from "@/lib/format";
import { filterTransactions, uniqueProducts } from "@/lib/scope";
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
    scope,
    setScope,
    clearScope,
  } = useAnalysis();
  const router = useRouter();
  const latest = result?.monthlySeries.at(-1);
  const store = settings.storeName || user?.storeName || "";
  const heading = title ?? `${t("header.welcome")} ${store}`.trim();
  const description = subtitle ?? t("header.overview");
  const initial = (user?.fullName || settings.ownerName || "S").slice(0, 1);
  const hasHighAlert = Boolean(result?.forecast.alerts.some((alert) => alert.severity === "high"));
  const monthOptions = Array.from(
    new Map(
      (parseResult?.transactions ?? [])
        .filter((tx) => tx.date)
        .map((tx) => {
          const key = monthKey(tx.date!.getFullYear(), tx.date!.getMonth());
          return [key, { key, month: tx.date!.getMonth(), year: tx.date!.getFullYear() }] as const;
        }),
    ).values(),
  ).sort((a, b) => a.key.localeCompare(b.key));
  const selectedMonth = monthOptions.find((option) => option.key === scope.monthKey);
  const dateLabel = selectedMonth
    ? `${months[selectedMonth.month]} ${selectedMonth.year}`
    : latest
      ? `${months[latest.month]} ${latest.year}`
      : "—";
  const monthScopedRows = filterTransactions(parseResult?.transactions ?? [], {
    monthKey: scope.monthKey,
    sheet: scope.sheet,
    product: null,
  });
  const productOptions = uniqueProducts(monthScopedRows.length ? monthScopedRows : parseResult?.transactions ?? []);
  if (scope.product && !productOptions.includes(scope.product)) productOptions.unshift(scope.product);
  const scopeParts = [
    selectedMonth ? `${months[selectedMonth.month]} ${selectedMonth.year}` : scope.sheet,
    scope.product,
  ].filter(Boolean);

  return (
    <header className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{heading}</h1>
          <p className="mt-1 text-sm text-muted">
            {description}
            {parseResult ? ` • ${t("header.currentFile")}: ${parseResult.fileName}` : ""}
          </p>
          {scopeParts.length > 0 ? (
            <p className="mt-1 text-xs text-accent">
              {t("scope.viewing")}: {scopeParts.join(" • ")}
            </p>
          ) : parseResult ? (
            <p className="mt-1 text-xs text-muted">{t("scope.hint")}</p>
          ) : null}
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

          {monthOptions.length > 1 && (
            <select
              aria-label={t("scope.month")}
              className="h-10 max-w-[170px] rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              value={scope.monthKey ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setScope({ monthKey: value || null, sheet: null });
              }}
            >
              <option value="" className="bg-card text-foreground">
                {t("scope.allMonths")}
              </option>
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key} className="bg-card text-foreground">
                  {months[option.month]} {option.year}
                </option>
              ))}
            </select>
          )}

          {productOptions.length > 1 && (
            <select
              aria-label={t("scope.product")}
              className="h-10 max-w-[200px] truncate rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              value={scope.product ?? ""}
              onChange={(event) => setScope({ product: event.target.value || null })}
            >
              <option value="" className="bg-card text-foreground">
                {t("scope.allProducts")}
              </option>
              {productOptions.map((name) => (
                <option key={name} value={name} className="bg-card text-foreground">
                  {name}
                </option>
              ))}
            </select>
          )}

          {(scope.monthKey || scope.product || scope.sheet) && (
            <Button variant="ghost" size="sm" onClick={clearScope}>
              {t("scope.clear")}
            </Button>
          )}

          <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted md:flex">
            <CalendarDays className="h-4 w-4" />
            {scope.monthKey
              ? dateLabel
              : monthOptions.length > 1
                ? t("scope.allMonths")
                : dateLabel}
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
