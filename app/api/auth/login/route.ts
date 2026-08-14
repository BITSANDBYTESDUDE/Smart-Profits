import { NextResponse } from "next/server";
import { findAccount, publicAccount } from "@/lib/server/accounts";
import { upsertAccount } from "@/lib/server/accounts";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const account = await findAccount(email);
    if (!account || account.password !== password) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة." }, { status: 401 });
    }
    if (account.status === "churned" || account.status === "inactive") {
      return NextResponse.json({ error: "هذا الحساب معطّل. راجعي مديرة المنصة." }, { status: 403 });
    }
    const saved = await upsertAccount({
      email,
      lastActive: new Date().toISOString(),
      status: "active",
    });
    return NextResponse.json({ ok: true, account: publicAccount(saved) });
  } catch {
    return NextResponse.json({ error: "تعذر تسجيل الدخول على الخادم." }, { status: 500 });
  }
}
