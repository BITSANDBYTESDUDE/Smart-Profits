"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DateRangeKey } from "@/lib/admin/config";
import { buildAdminSnapshot, saveUserOverride } from "@/lib/admin/metrics";
import type { AdminSnapshot, AdminUserRow } from "@/lib/admin/types";

interface AdminPortalValue {
  range: DateRangeKey;
  from: string;
  to: string;
  snapshot: AdminSnapshot | null;
  ready: boolean;
  setRange: (key: DateRangeKey) => void;
  setCustomRange: (from: string, to: string) => void;
  refresh: () => void;
  patchUser: (id: string, patch: Partial<AdminUserRow>) => void;
}

const AdminPortalContext = createContext<AdminPortalValue | null>(null);

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function AdminPortalProvider({ children }: { children: React.ReactNode }) {
  const [range, setRangeState] = useState<DateRangeKey>("month");
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [tick, setTick] = useState(0);
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSnapshot(buildAdminSnapshot(range, from, to));
    setReady(true);
  }, [range, from, to, tick]);

  const setRange = useCallback((key: DateRangeKey) => {
    setRangeState(key);
  }, []);

  const setCustomRange = useCallback((nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setRangeState("custom");
  }, []);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const patchUser = useCallback((id: string, patch: Partial<AdminUserRow>) => {
    saveUserOverride(id, patch);
    setTick((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ range, from, to, snapshot, ready, setRange, setCustomRange, refresh, patchUser }),
    [range, from, to, snapshot, ready, setRange, setCustomRange, refresh, patchUser],
  );

  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>;
}

export function useAdminPortal() {
  const ctx = useContext(AdminPortalContext);
  if (!ctx) throw new Error("useAdminPortal must be used within AdminPortalProvider");
  return ctx;
}
