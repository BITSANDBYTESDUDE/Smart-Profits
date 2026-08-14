import { promises as fs } from "fs";
import path from "path";
import type { AccountStatus, PlanTier } from "@/lib/admin/config";

export interface StoredAccount {
  fullName: string;
  storeName: string;
  email: string;
  password: string;
  createdAt: string;
  lastActive?: string;
  plan?: PlanTier;
  status?: AccountStatus;
}

const FILE = path.join(process.cwd(), "data", "users.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function readAccounts(): Promise<StoredAccount[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function upsertAccount(account: Partial<StoredAccount> & { email: string }) {
  const accounts = await readAccounts();
  const email = account.email.trim().toLowerCase();
  const index = accounts.findIndex((item) => item.email === email);
  const previous = index >= 0 ? accounts[index] : null;
  const next: StoredAccount = {
    fullName: account.fullName ?? previous?.fullName ?? "",
    storeName: account.storeName ?? previous?.storeName ?? "",
    email,
    password: account.password ?? previous?.password ?? "",
    createdAt: previous?.createdAt ?? account.createdAt ?? new Date().toISOString(),
    lastActive: account.lastActive ?? previous?.lastActive ?? new Date().toISOString(),
    plan: account.plan ?? previous?.plan ?? "free",
    status: account.status ?? previous?.status ?? "active",
  };
  if (index >= 0) accounts[index] = next;
  else accounts.push(next);
  await fs.writeFile(FILE, JSON.stringify(accounts, null, 2), "utf8");
  return next;
}

export async function findAccount(email: string) {
  const accounts = await readAccounts();
  return accounts.find((item) => item.email === email.trim().toLowerCase()) ?? null;
}

export function publicAccount(account: StoredAccount) {
  return {
    fullName: account.fullName,
    storeName: account.storeName,
    email: account.email,
    createdAt: account.createdAt,
    lastActive: account.lastActive,
    plan: account.plan ?? "free",
    status: account.status ?? "active",
  };
}
