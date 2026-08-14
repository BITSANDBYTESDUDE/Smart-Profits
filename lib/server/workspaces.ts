import { promises as fs } from "fs";
import path from "path";
import { fileSafeEmail } from "@/lib/tenant";
import type { PersistedWorkspace } from "@/lib/serialize";

const DIR = path.join(process.cwd(), "data", "workspaces");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function fileFor(email: string) {
  return path.join(DIR, `${fileSafeEmail(email)}.json`);
}

export async function saveWorkspace(email: string, workspace: PersistedWorkspace) {
  await ensureDir();
  const payload = { ...workspace, ownerEmail: email.trim().toLowerCase(), savedAt: new Date().toISOString() };
  await fs.writeFile(fileFor(email), JSON.stringify(payload), "utf8");
  return payload;
}

export async function loadWorkspace(email: string): Promise<PersistedWorkspace | null> {
  try {
    const raw = await fs.readFile(fileFor(email), "utf8");
    const parsed = JSON.parse(raw) as PersistedWorkspace;
    return parsed?.files ? parsed : null;
  } catch {
    return null;
  }
}

export async function listWorkspaces(): Promise<Array<{ email: string; workspace: PersistedWorkspace }>> {
  await ensureDir();
  const names = await fs.readdir(DIR);
  const rows: Array<{ email: string; workspace: PersistedWorkspace }> = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DIR, name), "utf8");
      const workspace = JSON.parse(raw) as PersistedWorkspace & { ownerEmail?: string };
      if (!workspace?.files) continue;
      const email = workspace.ownerEmail || name.replace(/\.json$/, "").replace(/_at_/g, "@");
      rows.push({ email: email.toLowerCase(), workspace });
    } catch {
      // skip
    }
  }
  return rows;
}
