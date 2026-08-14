"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { analyzeParsed, analyzeUploadedFile, demoParseResult } from "@/lib/engine";
import { DEFAULT_SETTINGS } from "@/lib/sample-data";
import {
  deserializeParseResult,
  serializeParseResult,
  type PersistedAnalysis,
  type PersistedWorkspace,
} from "@/lib/serialize";
import { normalizeOpexSettings } from "@/lib/opex";
import type {
  ActionLogEntry,
  AiRecommendation,
  AnalysisResult,
  AppSettings,
  CurrencyCode,
  ParseResult,
  WorkspaceFileMeta,
} from "@/lib/types";
import { FileParseError } from "@/lib/types";
import { trackPlatform } from "@/lib/admin/track";

const STORAGE_KEY = "smartprofit-workspace-v2";
const LEGACY_KEY = "smartprofit-analysis-v1";
const DEMO_FILE_ID = "demo";

interface StoredFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  isDemo: boolean;
  parseResult: ParseResult;
}

interface AnalysisContextValue {
  settings: AppSettings;
  currency: CurrencyCode;
  parseResult: ParseResult | null;
  result: AnalysisResult | null;
  isProcessing: boolean;
  error: string | null;
  isDemo: boolean;
  files: WorkspaceFileMeta[];
  activeFileId: string | null;
  actionLog: ActionLogEntry[];
  setCurrency: (currency: CurrencyCode) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  saveSettings: (next: AppSettings) => void;
  analyzeFile: (file: File) => Promise<void>;
  selectFile: (id: string) => void;
  removeFile: (id: string) => void;
  applyRecommendation: (rec: AiRecommendation) => ActionLogEntry;
  resetToDemo: () => void;
  clearError: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMeta(file: StoredFile): WorkspaceFileMeta {
  return {
    id: file.id,
    fileName: file.fileName,
    uploadedAt: file.uploadedAt,
    rowCount: file.parseResult.rowCount,
    isDemo: file.isDemo,
  };
}

function demoFile(): StoredFile {
  const parsed = demoParseResult();
  return {
    id: DEMO_FILE_ID,
    fileName: parsed.fileName,
    uploadedAt: new Date().toISOString(),
    isDemo: true,
    parseResult: parsed,
  };
}

function persistWorkspace(
  settings: AppSettings,
  files: StoredFile[],
  activeFileId: string,
  actionLog: ActionLogEntry[],
) {
  const payload: PersistedWorkspace = {
    version: 2,
    settings,
    activeFileId,
    actionLog,
    files: files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      uploadedAt: file.uploadedAt,
      isDemo: file.isDemo,
      parseResult: serializeParseResult(file.parseResult),
    })),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota or private mode — keep working in memory
  }
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_SETTINGS.defaultCurrency);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0] ?? null;
  const parseResult = activeFile?.parseResult ?? null;
  const isDemo = activeFile?.isDemo ?? true;

  const result = useMemo(
    () => (parseResult ? analyzeParsed(parseResult, settings) : null),
    [parseResult, settings],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedWorkspace;
        const nextSettings = normalizeOpexSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        const restored = (saved.files ?? []).map((file) => ({
          id: file.id,
          fileName: file.fileName,
          uploadedAt: file.uploadedAt,
          isDemo: file.isDemo,
          parseResult: deserializeParseResult(file.parseResult),
        }));
        const withDemo = restored.some((file) => file.isDemo) ? restored : [demoFile(), ...restored];
        setSettings(nextSettings);
        setCurrencyState(nextSettings.defaultCurrency);
        setFiles(withDemo);
        setActiveFileId(saved.activeFileId && withDemo.some((file) => file.id === saved.activeFileId)
          ? saved.activeFileId
          : withDemo.find((file) => !file.isDemo)?.id ?? withDemo[0].id);
        setActionLog(saved.actionLog ?? []);
        setHydrated(true);
        return;
      }

      const legacyRaw = localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        const saved = JSON.parse(legacyRaw) as PersistedAnalysis;
        const parsed = deserializeParseResult(saved.parseResult);
        const nextSettings = normalizeOpexSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        const legacyFile: StoredFile = {
          id: newId(),
          fileName: parsed.fileName,
          uploadedAt: new Date().toISOString(),
          isDemo: parsed.fileName.includes("تجريبية"),
          parseResult: parsed,
        };
        const nextFiles = legacyFile.isDemo ? [legacyFile] : [demoFile(), legacyFile];
        setSettings(nextSettings);
        setCurrencyState(nextSettings.defaultCurrency);
        setFiles(nextFiles);
        setActiveFileId(legacyFile.id);
        persistWorkspace(nextSettings, nextFiles, legacyFile.id, []);
        setHydrated(true);
        return;
      }
    } catch {
      // fall through to demo data
    }

    const seed = demoFile();
    setFiles([seed]);
    setActiveFileId(seed.id);
    persistWorkspace(DEFAULT_SETTINGS, [seed], seed.id, []);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !activeFileId || files.length === 0) return;
    persistWorkspace(settings, files, activeFileId, actionLog);
  }, [hydrated, settings, files, activeFileId, actionLog]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    setSettings((prev) => ({ ...prev, defaultCurrency: next }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    setCurrencyState(next.defaultCurrency);
  }, []);

  const selectFile = useCallback((id: string) => {
    setActiveFileId(id);
    setError(null);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((file) => file.id !== id);
      const next = remaining.length ? remaining : [demoFile()];
      setActiveFileId((current) => {
        if (current !== id) return current;
        return next.find((file) => !file.isDemo)?.id ?? next[0].id;
      });
      return next;
    });
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { parsed } = await analyzeUploadedFile(file, settings);
      const nextFile: StoredFile = {
        id: newId(),
        fileName: parsed.fileName,
        uploadedAt: new Date().toISOString(),
        isDemo: false,
        parseResult: parsed,
      };
      setFiles((prev) => [...prev, nextFile]);
      setActiveFileId(nextFile.id);
      trackPlatform("analyze", parsed.fileName);
    } catch (err) {
      const message =
        err instanceof FileParseError
          ? err.message
          : /detached|structuredClone|DataCloneError/i.test(err instanceof Error ? err.message : "")
            ? "تعذر قراءة ملف PDF في المتصفح. أعد رفع الملف أو استخدم Excel/CSV."
            : "حدث خطأ غير متوقع أثناء تحليل الملف. حاول بملف Excel أو CSV أو PDF نصي منظم.";
      setError(message);
      trackPlatform("upload_error", file.name);
      throw new FileParseError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [settings]);

  const applyRecommendation = useCallback((rec: AiRecommendation): ActionLogEntry => {
    const fileId = activeFileId ?? DEMO_FILE_ID;
    const fileName = parseResult?.fileName ?? "بدون ملف";
    const existing = actionLog.find(
      (entry) => entry.fileId === fileId && entry.recommendationId === rec.id,
    );
    if (existing) return existing;

    const entry: ActionLogEntry = {
      id: newId(),
      fileId,
      fileName,
      recommendationId: rec.id,
      title: rec.title,
      body: rec.body,
      actionLabel: rec.actionLabel,
      appliedAt: new Date().toISOString(),
      status: rec.actionLabel.includes("تطبيق") ? "applied" : "reviewed",
    };
    setActionLog((prev) => [entry, ...prev]);
    return entry;
  }, [actionLog, activeFileId, parseResult]);

  const resetToDemo = useCallback(() => {
    const seed = demoFile();
    setFiles((prev) => {
      const withoutDemo = prev.filter((file) => !file.isDemo);
      return [seed, ...withoutDemo];
    });
    setActiveFileId(seed.id);
  }, []);

  const value = useMemo<AnalysisContextValue>(
    () => ({
      settings,
      currency,
      parseResult,
      result,
      isProcessing,
      error,
      isDemo,
      files: files.map(toMeta),
      activeFileId: activeFile?.id ?? null,
      actionLog,
      setCurrency,
      updateSettings,
      saveSettings,
      analyzeFile,
      selectFile,
      removeFile,
      applyRecommendation,
      resetToDemo,
      clearError: () => setError(null),
    }),
    [
      settings,
      currency,
      parseResult,
      result,
      isProcessing,
      error,
      isDemo,
      files,
      activeFile,
      actionLog,
      setCurrency,
      updateSettings,
      saveSettings,
      analyzeFile,
      selectFile,
      removeFile,
      applyRecommendation,
      resetToDemo,
    ],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
