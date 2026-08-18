import { NextResponse } from "next/server";
import { findAccount, findAccountByPhone, upsertAccount } from "@/lib/server/accounts";
import { normalizeMobile } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      storeName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const storeName = String(body.storeName || "").trim();
    const existing = await findAccount(email);
    const phone = normalizeMobile(String(body.phone || existing?.phone || ""));

    if (!email || !email.includes("@") || password.length < 6 || !fullName || !storeName) {
      return NextResponse.json({ error: "أكمل البيانات بشكل صحيح." }, { status: 400 });
    }
    if (!existing && !phone) {
      return NextResponse.json({ error: "رقم الجوال مطلوب لإنشاء الحساب." }, { status: 400 });
    }

    const taken = phone ? await findAccountByPhone(phone, email) : null;
    if (taken) {
      return NextResponse.json({ error: "رقم الجوال مرتبط بحساب آخر." }, { status: 409 });
    }

    await upsertAccount({
      fullName,
      storeName,
      email,
      phone: phone || existing?.phone || "",
      password,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      plan: "free",
      status: "active",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الحساب." }, { status: 500 });
  }
}
