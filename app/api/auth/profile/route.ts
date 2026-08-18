import { NextResponse } from "next/server";
import { findAccount, findAccountByPhone, upsertAccount } from "@/lib/server/accounts";
import { normalizeMobile } from "@/lib/phone";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() || "";
  if (!email) return NextResponse.json({ error: "البريد مطلوب." }, { status: 400 });
  const existing = await findAccount(email);
  if (!existing) return NextResponse.json({ error: "الحساب غير موجود." }, { status: 404 });
  return NextResponse.json({
    fullName: existing.fullName,
    storeName: existing.storeName,
    email: existing.email,
    phone: existing.phone,
    homeLat: existing.homeLat ?? null,
    homeLng: existing.homeLng ?? null,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      storeName?: string;
      phone?: string;
      homeLat?: number | null;
      homeLng?: number | null;
    };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "البريد مطلوب." }, { status: 400 });
    }

    const existing = await findAccount(email);
    if (!existing) {
      return NextResponse.json({ error: "الحساب غير موجود." }, { status: 404 });
    }

    const phone = normalizeMobile(String(body.phone ?? existing.phone ?? ""));
    if (!phone) {
      return NextResponse.json({ error: "رقم الجوال غير صالح. استخدمي الصيغة الدولية مثل +97059XXXXXXX." }, { status: 400 });
    }

    const taken = await findAccountByPhone(phone, email);
    if (taken) {
      return NextResponse.json({ error: "رقم الجوال مرتبط بحساب آخر." }, { status: 409 });
    }

    const saved = await upsertAccount({
      email,
      fullName: body.fullName !== undefined ? String(body.fullName).trim() : existing.fullName,
      storeName: body.storeName !== undefined ? String(body.storeName).trim() : existing.storeName,
      phone,
      homeLat: body.homeLat !== undefined ? body.homeLat ?? undefined : existing.homeLat,
      homeLng: body.homeLng !== undefined ? body.homeLng ?? undefined : existing.homeLng,
      lastActive: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      account: {
        fullName: saved.fullName,
        storeName: saved.storeName,
        email: saved.email,
        phone: saved.phone,
        homeLat: saved.homeLat ?? null,
        homeLng: saved.homeLng ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الملف الشخصي." }, { status: 500 });
  }
}
