import { NextResponse } from "next/server";
import { upsertAccount } from "@/lib/server/accounts";
import type { AccountStatus, PlanTier } from "@/lib/admin/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      plan?: PlanTier;
      status?: AccountStatus;
    };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "البريد مطلوب." }, { status: 400 });
    await upsertAccount({ email, plan: body.plan, status: body.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر تحديث المستخدم." }, { status: 500 });
  }
}
