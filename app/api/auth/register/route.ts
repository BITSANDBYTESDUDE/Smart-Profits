import { NextResponse } from "next/server";
import { upsertAccount } from "@/lib/server/accounts";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      storeName?: string;
      email?: string;
      password?: string;
    };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const storeName = String(body.storeName || "").trim();

    if (!email || !email.includes("@") || password.length < 6 || !fullName || !storeName) {
      return NextResponse.json({ error: "أكمل البيانات بشكل صحيح." }, { status: 400 });
    }

    await upsertAccount({ fullName, storeName, email, password });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الحساب." }, { status: 500 });
  }
}
