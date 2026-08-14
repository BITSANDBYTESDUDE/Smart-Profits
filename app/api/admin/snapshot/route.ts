import { NextResponse } from "next/server";
import type { AdminFacts } from "@/lib/admin/metrics";
import { readAccounts } from "@/lib/server/accounts";
import { readEvents } from "@/lib/server/events";
import { listWorkspaces } from "@/lib/server/workspaces";

export async function GET() {
  const accounts = await readAccounts();
  const events = await readEvents();
  const workspaces = await listWorkspaces();

  const facts: AdminFacts = {
    users: accounts.map((account) => ({
      fullName: account.fullName,
      storeName: account.storeName,
      email: account.email,
      createdAt: account.createdAt,
      lastActive: account.lastActive,
      plan: account.plan,
      status: account.status,
    })),
    events,
    workspaces: workspaces.map(({ email, workspace }) => ({
      email,
      workspace: {
        ...workspace,
        actionLog: [],
        files: workspace.files.map((file) => ({
          ...file,
          parseResult: {
            ...file.parseResult,
            transactions: [],
          },
        })),
      },
    })),
  };

  return NextResponse.json(facts);
}
