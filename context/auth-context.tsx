"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AccountStatus, PlanTier } from "@/lib/admin/config";
import { trackPlatform } from "@/lib/admin/track";
import { normalizeEmail, SESSION_KEY, SESSION_USER_KEY, USERS_KEY } from "@/lib/tenant";
import { normalizeMobile } from "@/lib/phone";

export interface AuthUser {
  fullName: string;
  storeName: string;
  email: string;
  phone: string;
}

export interface StoredUser extends AuthUser {
  password: string;
  createdAt?: string;
  lastActive?: string;
  plan?: PlanTier;
  status?: AccountStatus;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  register: (user: StoredUser) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  updateProfile: (patch: Partial<Pick<AuthUser, "fullName" | "storeName" | "phone">>) => Promise<boolean>;
  findAccount: (email: string) => StoredUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(parsed)) return parsed;
    }
    const legacy = localStorage.getItem(SESSION_USER_KEY);
    if (!legacy) return [];
    const one = JSON.parse(legacy) as StoredUser;
    if (one?.email) return [one];
  } catch {
    return [];
  }
  return [];
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function withoutPassword(user: StoredUser): AuthUser {
  return {
    fullName: user.fullName,
    storeName: user.storeName,
    email: normalizeEmail(user.email),
    phone: user.phone || "",
  };
}

function touchUser(users: StoredUser[], email: string, extra?: Partial<StoredUser>) {
  const key = normalizeEmail(email);
  return users.map((item) =>
    item.email.toLowerCase() === key
      ? { ...item, ...extra, lastActive: extra?.lastActive ?? new Date().toISOString() }
      : item,
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      const users = readUsers();
      const raw = session ? localStorage.getItem(SESSION_USER_KEY) : null;
      let current: StoredUser | null = null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as StoredUser | AuthUser;
          current = users.find((item) => item.email.toLowerCase() === parsed.email.toLowerCase()) ?? null;
        } catch {
          current = null;
        }
      }
      if (session && current) {
        if (current.status === "inactive" || current.status === "churned") {
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
        } else {
          writeUsers(touchUser(users, current.email));
          setUser(withoutPassword(current));
        }
      }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  const register = useCallback(async (next: StoredUser) => {
    const email = normalizeEmail(next.email);
    const phone = normalizeMobile(next.phone || "") || "";
    const now = new Date().toISOString();
    const account: StoredUser = {
      ...next,
      email,
      phone,
      createdAt: next.createdAt || now,
      lastActive: now,
      plan: next.plan ?? "free",
      status: "active",
    };
    const users = readUsers().filter((item) => item.email.toLowerCase() !== email);
    if (phone && users.some((item) => item.phone === phone)) {
      throw new Error("phone-taken");
    }
    users.push(account);
    writeUsers(users);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(withoutPassword(account)));
    localStorage.setItem(SESSION_KEY, "1");
    setUser(withoutPassword(account));
    trackPlatform("register", account.storeName, email);

    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    }).catch(() => undefined);
  }, []);

  const findAccount = useCallback((email: string) => {
    return readUsers().find((item) => item.email.toLowerCase() === normalizeEmail(email)) ?? null;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const key = normalizeEmail(email);
    let account = readUsers().find((item) => item.email.toLowerCase() === key) ?? null;
    if (account && account.password !== password) return false;
    if (account && (account.status === "inactive" || account.status === "churned")) return false;

    if (!account) {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: key, password }),
        });
        if (!response.ok) return false;
        const data = (await response.json()) as {
          account?: {
            fullName: string;
            storeName: string;
            email: string;
            phone?: string;
            createdAt?: string;
            lastActive?: string;
            plan?: PlanTier;
            status?: AccountStatus;
          };
        };
        if (!data.account) return false;
        account = {
          fullName: data.account.fullName,
          storeName: data.account.storeName,
          email: data.account.email,
          phone: data.account.phone || "",
          password,
          createdAt: data.account.createdAt,
          lastActive: data.account.lastActive,
          plan: data.account.plan,
          status: data.account.status,
        };
        writeUsers([...readUsers().filter((item) => item.email.toLowerCase() !== key), account]);
      } catch {
        return false;
      }
    } else {
      const now = new Date().toISOString();
      writeUsers(touchUser(readUsers(), key, { lastActive: now, status: "active" }));
      void fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: key, password }),
      }).catch(() => undefined);
    }

    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(withoutPassword(account)));
    localStorage.setItem(SESSION_KEY, "1");
    setUser(withoutPassword(account));
    trackPlatform("login", account.storeName, key);
    return true;
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<AuthUser, "fullName" | "storeName" | "phone">>) => {
    if (!user) return false;
    const email = normalizeEmail(user.email);
    const users = readUsers();
    const current = users.find((item) => item.email.toLowerCase() === email);
    if (!current) return false;

    let phone = current.phone || "";
    if (patch.phone !== undefined) {
      const normalized = normalizeMobile(patch.phone);
      if (!normalized) return false;
      const taken = users.some((item) => item.email.toLowerCase() !== email && item.phone === normalized);
      if (taken) return false;
      phone = normalized;
    }

    const account: StoredUser = {
      ...current,
      fullName: patch.fullName !== undefined ? patch.fullName.trim() : current.fullName,
      storeName: patch.storeName !== undefined ? patch.storeName.trim() : current.storeName,
      phone,
      lastActive: new Date().toISOString(),
    };
    writeUsers(users.map((item) => (item.email.toLowerCase() === email ? account : item)));
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(withoutPassword(account)));
    setUser(withoutPassword(account));

    await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        fullName: account.fullName,
        storeName: account.storeName,
        phone: account.phone,
      }),
    }).catch(() => undefined);

    return true;
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, register, login, updateProfile, findAccount, logout }),
    [user, ready, register, login, updateProfile, findAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
