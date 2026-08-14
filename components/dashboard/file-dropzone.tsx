"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OpexSetupModal } from "@/components/opex/opex-setup-modal";
import { useAnalysis } from "@/context/analysis-context";
import type { AppSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FileDropzone({
  compact = false,
  title,
  hint,
}: {
  compact?: boolean;
  title?: string;
  hint?: string;
  redirectToAnalysis?: boolean;
}) {
  const { analyzeFile, isProcessing, saveSettings } = useAnalysis();
  const router = useRouter();
  const [setupOpen, setSetupOpen] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const pendingFiles = useRef<File[] | null>(null);
  const analyzeAfterPicker = useRef(false);

  const runAnalysis = useCallback(
    async (files: File[]) => {
      const selected = files.filter(Boolean);
      if (!selected.length) return;
      try {
        for (const file of selected) {
          await analyzeFile(file);
        }
        toast.success(
          selected.length > 1
            ? `تمت دراسة ${selected.length} ملفات بكل أوراق العمل. اختر ملفاً من القائمة لعرض تحليله.`
            : "تمت دراسة كل أوراق Excel ودمجها. التحليل باقٍ أمامك.",
        );
        router.replace("/data");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحليل الملف");
      }
    },
    [analyzeFile, router],
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      const selected = files.filter(Boolean);
      if (!selected.length) return;
      if (analyzeAfterPicker.current) {
        analyzeAfterPicker.current = false;
        await runAnalysis(selected);
        return;
      }
      pendingFiles.current = selected;
      setHasPending(true);
      setSetupOpen(true);
    },
    [runAnalysis],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    maxSize: 50 * 1024 * 1024,
    disabled: isProcessing,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
  });

  function handleZoneClick() {
    if (isProcessing) return;
    pendingFiles.current = null;
    setHasPending(false);
    setSetupOpen(true);
  }

  function handleConfirm(next: AppSettings) {
    saveSettings(next);
    setSetupOpen(false);
    const held = pendingFiles.current;
    pendingFiles.current = null;
    setHasPending(false);
    if (held?.length) {
      void runAnalysis(held);
      return;
    }
    analyzeAfterPicker.current = true;
    window.setTimeout(() => open(), 60);
  }

  function handleConfirmSkip() {
    setSetupOpen(false);
    const held = pendingFiles.current;
    pendingFiles.current = null;
    setHasPending(false);
    if (held?.length) {
      void runAnalysis(held);
      return;
    }
    analyzeAfterPicker.current = true;
    window.setTimeout(() => open(), 60);
  }

  function handleClose() {
    pendingFiles.current = null;
    setHasPending(false);
    analyzeAfterPicker.current = false;
    setSetupOpen(false);
  }

  const rootProps = getRootProps();

  return (
    <>
      <div
        {...rootProps}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleZoneClick();
        }}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed transition",
          isDragActive ? "border-primary bg-primary/10" : "border-slate-600/70 bg-card/50 hover:border-primary/60",
          compact ? "p-6" : "p-10",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <CloudUpload className="h-7 w-7" />}
          </div>
          <p className="text-base font-medium text-white">
            {title ?? (isProcessing ? "جاري قراءة الملف واستخراج الأعمدة..." : "اسحب ملف Excel أو CSV أو PDF أو صورة هنا")}
          </p>
          <p className="mt-1 text-sm text-muted">{hint ?? "أو اضغط للرفع • الحد الأقصى 50MB"}</p>
          <p className="mt-2 max-w-md text-xs leading-6 text-amber-200/80">
            قبل التحليل نسألك عن الإيجار والرواتب والفواتير حتى لا يُحسب ربح وهمي من ملف المبيعات وحده.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            ندعم Excel بكل أوراقه (يناير، فبراير، الملخص...) وCSV وPDF والصور
          </div>
        </div>
      </div>
      <OpexSetupModal
        open={setupOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        onSkip={handleConfirmSkip}
        confirmLabel={hasPending ? "حفظ ثم تحليل الملف" : "متابعة لرفع الملف"}
        skipLabel="تخطي ومتابعة الرفع"
      />
    </>
  );
}
