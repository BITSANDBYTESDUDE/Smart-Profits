"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface AuthUser {
  fullName: string;
  storeName: string;
  email: string;
}

export interface StoredUser extends AuthUser {
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  register: (user: StoredUser) => Promise<void>;
  login: (email: string, password: string) => boolean;
  findAccount: (email: string) => StoredUser | null;
  logout: () => void;
}

const USER_KEY = "smartprofit-user";
const USERS_KEY = "smartprofit-users";
const SESSION_KEY = "smartprofit-session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(parsed)) return parsed;
    }
    const legacy = localStorage.getItem(USER_KEY);
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
  return { fullName: user.fullName, storeName: user.storeName, email: user.email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      const users = readUsers();
      const email = session ? localStorage.getItem(USER_KEY) : null;
      let current: StoredUser | null = null;
      if (email) {
        try {
          const parsed = JSON.parse(email) as StoredUser | AuthUser;
          current = users.find((item) => item.email.toLowerCase() === parsed.email.toLowerCase()) ?? null;
          if (!current && parsed.email) {
            current = { ...parsed, password: "password" in parsed ? String(parsed.password || "") : "" };
          }
        } catch {
          current = null;
        }
      }
      if (session && current) setUser(withoutPassword(current));
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  const register = useCallback(async (next: StoredUser) => {
    const email = next.email.trim().toLowerCase();
    const account = { ...next, email };
    const users = readUsers().filter((item) => item.email.toLowerCase() !== email);
    users.push(account);
    writeUsers(users);
    localStorage.setItem(USER_KEY, JSON.stringify(withoutPassword(account)));
    localStorage.setItem(SESSION_KEY, "1");
    setUser(withoutPassword(account));

    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    }).catch(() => undefined);
  }, []);

  const findAccount = useCallback((email: string) => {
    return (
      readUsers().find((item) => item.email.trim().toLowerCase() === email.trim().toLowerCase()) ?? null
    );
  }, []);

  const login = useCallback((email: string, password: string) => {
    const account = readUsers().find(
      (item) => item.email.trim().toLowerCase() === email.trim().toLowerCase(),
    );
    if (!account || account.password !== password) return false;
    localStorage.setItem(USER_KEY, JSON.stringify(withoutPassword(account)));
    localStorage.setItem(SESSION_KEY, "1");
    setUser(withoutPassword(account));
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, register, login, findAccount, logout }),
    [user, ready, register, login, findAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
