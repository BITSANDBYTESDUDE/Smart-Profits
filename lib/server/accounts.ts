import { promises as fs } from "fs";
import path from "path";

export interface StoredAccount {
  fullName: string;
  storeName: string;
  email: string;
  password: string;
  createdAt: string;
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

export async function upsertAccount(account: Omit<StoredAccount, "createdAt"> & { createdAt?: string }) {
  const accounts = await readAccounts();
  const email = account.email.trim().toLowerCase();
  const next: StoredAccount = {
    fullName: account.fullName,
    storeName: account.storeName,
    email,
    password: account.password,
    createdAt: account.createdAt ?? new Date().toISOString(),
  };
  const index = accounts.findIndex((item) => item.email === email);
  if (index >= 0) accounts[index] = { ...accounts[index], ...next };
  else accounts.push(next);
  await fs.writeFile(FILE, JSON.stringify(accounts, null, 2), "utf8");
  return next;
}

export async function findAccount(email: string) {
  const accounts = await readAccounts();
  return accounts.find((item) => item.email === email.trim().toLowerCase()) ?? null;
}
