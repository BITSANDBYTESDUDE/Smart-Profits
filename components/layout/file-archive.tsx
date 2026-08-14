"use client";

import { Archive, FileSpreadsheet, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/analysis-context";
import { formatDateAr } from "@/lib/format";
import { cn } from "@/lib/utils";

function sortFiles<T extends { isDemo: boolean; uploadedAt: string }>(files: T[]) {
  return [...files].sort((a, b) => {
    if (a.isDemo !== b.isDemo) return a.isDemo ? 1 : -1;
    return b.uploadedAt.localeCompare(a.uploadedAt);
  });
}

export function FileArchiveList({
  compact = false,
  openOnSelect = true,
}: {
  compact?: boolean;
  openOnSelect?: boolean;
}) {
  const { files, activeFileId, selectFile, removeFile } = useAnalysis();
  const router = useRouter();
  const ordered = sortFiles(files);

  function openFile(id: string) {
    selectFile(id);
    if (openOnSelect) router.push("/data");
  }

  if (ordered.length === 0) {
    return <p className="px-3 text-sm text-muted">لا توجد ملفات في الأرشيف بعد.</p>;
  }

  return (
    <div className={cn("space-y-2", compact ? "" : "rounded-2xl border border-border bg-white/3 p-3")}>
      <p className={cn("text-[11px] font-medium tracking-wide text-slate-500", compact && "mb-1 px-3")}>
        أرشيف الملفات
      </p>
      <div className={cn("space-y-1", compact ? "max-h-52 overflow-y-auto" : "")}>
        {ordered.map((file) => {
          const active = file.id === activeFileId;
          return (
            <div
              key={file.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl transition",
                active ? "bg-primary/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <button
                type="button"
                onClick={() => openFile(file.id)}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-start text-sm"
              >
                <FileSpreadsheet className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-slate-500")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{file.fileName}</span>
                  {!compact && (
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {formatDateAr(new Date(file.uploadedAt))} • {file.rowCount} صف
                    </span>
                  )}
                </span>
                {file.isDemo ? (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">
                    تجريبي
                  </span>
                ) : active ? (
                  <span className="shrink-0 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">مفتوح</span>
                ) : null}
              </button>
              {!file.isDemo && (
                <button
                  type="button"
                  aria-label={`حذف ${file.fileName}`}
                  className="me-1 rounded-lg p-1.5 text-slate-500 opacity-0 hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {compact && (
        <button
          type="button"
          onClick={() => router.push("/data?tab=archive")}
          className="mt-1 flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-white"
        >
          <Archive className="h-3.5 w-3.5" />
          فتح الأرشيف كاملاً
        </button>
      )}
    </div>
  );
}

export function FileArchiveCards() {
  const { files, activeFileId, selectFile, removeFile } = useAnalysis();
  const router = useRouter();
  const ordered = sortFiles(files);
  const uploaded = ordered.filter((file) => !file.isDemo);

  if (uploaded.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-600 p-8 text-center">
        <Archive className="mx-auto mb-3 h-10 w-10 text-slate-500" />
        <p className="text-white">الأرشيف فارغ</p>
        <p className="mt-2 text-sm text-muted">ارفع Excel أو PDF أو صورة، وستبقى هنا حتى تضغط عليها لفتح التحليل.</p>
        <Button className="mt-4" onClick={() => router.push("/data")}>
          رفع ملف
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ordered.map((file) => {
        const active = file.id === activeFileId;
        return (
          <div
            key={file.id}
            className={cn(
              "rounded-2xl border p-4 transition",
              active ? "border-accent/40 bg-accent/8" : "border-border bg-white/3 hover:border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{file.fileName}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDateAr(new Date(file.uploadedAt))} • {file.rowCount} صف
                </p>
              </div>
              {file.isDemo ? <Badge tone="warning">تجريبي</Badge> : active ? <Badge tone="success">مفتوح الآن</Badge> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={active ? "accent" : "default"}
                onClick={() => {
                  selectFile(file.id);
                  router.push("/data");
                }}
              >
                {active ? "متابعة التحليل" : "فتح التحليل"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                selectFile(file.id);
                router.push("/dashboard");
              }}>
                لوحة القيادة
              </Button>
              {!file.isDemo && (
                <Button size="sm" variant="ghost" onClick={() => removeFile(file.id)}>
                  حذف
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
