"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "@/context/auth-context";
import {
  LEGACY_ANALYSIS_KEY,
  LEGACY_WORKSPACE_KEY,
  MIGRATION_KEY,
  normalizeEmail,
  workspaceKey,
} from "@/lib/tenant";

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

function toPersisted(
  email: string,
  settings: AppSettings,
  files: StoredFile[],
  activeFileId: string,
  actionLog: ActionLogEntry[],
): PersistedWorkspace {
  return {
    version: 2,
    ownerEmail: email,
    savedAt: new Date().toISOString(),
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
}

function fromPersisted(saved: PersistedWorkspace): {
  settings: AppSettings;
  files: StoredFile[];
  activeFileId: string;
  actionLog: ActionLogEntry[];
} {
  const settings = normalizeOpexSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
  const files = (saved.files ?? []).map((file) => ({
    id: file.id,
    fileName: file.fileName,
    uploadedAt: file.uploadedAt,
    isDemo: file.isDemo,
    parseResult: deserializeParseResult(file.parseResult),
  }));
  const withDemo = files.some((file) => file.isDemo) ? files : [demoFile(), ...files];
  const activeFileId =
    saved.activeFileId && withDemo.some((file) => file.id === saved.activeFileId)
      ? saved.activeFileId
      : withDemo.find((file) => !file.isDemo)?.id ?? withDemo[0].id;
  return { settings, files: withDemo, activeFileId, actionLog: saved.actionLog ?? [] };
}

function readLocalWorkspace(email: string): PersistedWorkspace | null {
  try {
    const dedicated = localStorage.getItem(workspaceKey(email));
    if (dedicated) return JSON.parse(dedicated) as PersistedWorkspace;
    const already = localStorage.getItem(MIGRATION_KEY);
    if (already) return null;
    const legacy = localStorage.getItem(LEGACY_WORKSPACE_KEY);
    if (legacy) {
      localStorage.setItem(workspaceKey(email), legacy);
      localStorage.setItem(MIGRATION_KEY, email);
      return JSON.parse(legacy) as PersistedWorkspace;
    }
    const legacyV1 = localStorage.getItem(LEGACY_ANALYSIS_KEY);
    if (!legacyV1) return null;
    const saved = JSON.parse(legacyV1) as PersistedAnalysis;
    const parsed = deserializeParseResult(saved.parseResult);
    const file: StoredFile = {
      id: newId(),
      fileName: parsed.fileName,
      uploadedAt: new Date().toISOString(),
      isDemo: parsed.fileName.includes("تجريبية"),
      parseResult: parsed,
    };
    const workspace = toPersisted(
      email,
      normalizeOpexSettings({ ...DEFAULT_SETTINGS, ...saved.settings }),
      file.isDemo ? [file] : [demoFile(), file],
      file.id,
      [],
    );
    localStorage.setItem(workspaceKey(email), JSON.stringify(workspace));
    localStorage.setItem(MIGRATION_KEY, email);
    return workspace;
  } catch {
    return null;
  }
}

function persistLocal(email: string, workspace: PersistedWorkspace) {
  try {
    localStorage.setItem(workspaceKey(email), JSON.stringify(workspace));
  } catch {
    // quota — server backup still runs
  }
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const ownerEmail = user?.email ? normalizeEmail(user.email) : null;

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_SETTINGS.defaultCurrency);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [boundEmail, setBoundEmail] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0] ?? null;
  const parseResult = activeFile?.parseResult ?? null;
  const isDemo = activeFile?.isDemo ?? true;

  const result = useMemo(
    () => (parseResult ? analyzeParsed(parseResult, settings) : null),
    [parseResult, settings],
  );

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    setHydrated(false);
    setBoundEmail(null);
    setError(null);

    async function load() {
      if (!ownerEmail) {
        const seed = demoFile();
        if (cancelled) return;
        setSettings(DEFAULT_SETTINGS);
        setCurrencyState(DEFAULT_SETTINGS.defaultCurrency);
        setFiles([seed]);
        setActiveFileId(seed.id);
        setActionLog([]);
        setHydrated(true);
        return;
      }

      let saved = readLocalWorkspace(ownerEmail);
      if (!saved) {
        try {
          const response = await fetch(`/api/workspace?email=${encodeURIComponent(ownerEmail)}`);
          if (response.ok) {
            const data = (await response.json()) as { workspace: PersistedWorkspace | null };
            saved = data.workspace;
          }
        } catch {
          saved = null;
        }
      }

      if (cancelled) return;

      if (saved?.files?.length) {
        const restored = fromPersisted(saved);
        setSettings(restored.settings);
        setCurrencyState(restored.settings.defaultCurrency);
        setFiles(restored.files);
        setActiveFileId(restored.activeFileId);
        setActionLog(restored.actionLog);
      } else {
        const seed = demoFile();
        const nextSettings = {
          ...DEFAULT_SETTINGS,
          storeName: user?.storeName || DEFAULT_SETTINGS.storeName,
          ownerName: user?.fullName || DEFAULT_SETTINGS.ownerName,
        };
        setSettings(nextSettings);
        setCurrencyState(nextSettings.defaultCurrency);
        setFiles([seed]);
        setActiveFileId(seed.id);
        setActionLog([]);
      }
      setBoundEmail(ownerEmail);
      setHydrated(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authReady, ownerEmail, user?.storeName, user?.fullName]);

  useEffect(() => {
    if (!hydrated || !ownerEmail || boundEmail !== ownerEmail || !activeFileId || files.length === 0) return;
    const workspace = toPersisted(ownerEmail, settings, files, activeFileId, actionLog);
    persistLocal(ownerEmail, workspace);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ownerEmail, workspace }),
      }).catch(() => undefined);
    }, 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [hydrated, ownerEmail, boundEmail, settings, files, activeFileId, actionLog]);

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

  const analyzeFile = useCallback(
    async (file: File) => {
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
        trackPlatform("analyze", parsed.fileName, ownerEmail ?? undefined);
      } catch (err) {
        const message =
          err instanceof FileParseError
            ? err.message
            : /detached|structuredClone|DataCloneError/i.test(err instanceof Error ? err.message : "")
              ? "تعذر قراءة ملف PDF في المتصفح. أعد رفع الملف أو استخدم Excel/CSV."
              : "حدث خطأ غير متوقع أثناء تحليل الملف. حاول بملف Excel أو CSV أو PDF نصي منظم.";
        setError(message);
        trackPlatform("upload_error", file.name, ownerEmail ?? undefined);
        throw new FileParseError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [settings, ownerEmail],
  );

  const applyRecommendation = useCallback(
    (rec: AiRecommendation): ActionLogEntry => {
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
    },
    [actionLog, activeFileId, parseResult],
  );

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
