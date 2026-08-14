"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_ADMIN } from "@/lib/admin/config";

const SESSION_KEY = "smartprofit-admin-session";

export interface AdminSession {
  email: string;
  name: string;
}

interface AdminAuthValue {
  admin: AdminSession | null;
  ready: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminSession;
        if (parsed?.email) setAdmin(parsed);
      }
    } catch {
      setAdmin(null);
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback((email: string, password: string) => {
    const match =
      email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() && password === DEFAULT_ADMIN.password;
    if (!match) return false;
    const session = { email: DEFAULT_ADMIN.email, name: DEFAULT_ADMIN.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAdmin(session);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, ready, login, logout }), [admin, ready, login, logout]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
