import { NextResponse } from "next/server";
import { findAccount } from "@/lib/server/accounts";
import { sendPasswordEmail } from "@/lib/server/send-password-email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; fullName?: string };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "ضع بريداً إلكترونياً صحيحاً." }, { status: 400 });
    }

    const account = await findAccount(email);
    const password = account?.password || String(body.password || "");
    const fullName = account?.fullName || String(body.fullName || "");

    if (!account && !password) {
      return NextResponse.json(
        { error: "هذا البريد غير مسجّل في المنصة. أنشئ حساباً أولاً." },
        { status: 404 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "لا توجد كلمة مرور محفوظة لهذا الحساب. أعد إنشاء الحساب." },
        { status: 400 },
      );
    }

    const result = await sendPasswordEmail(email, password, fullName);
    return NextResponse.json({
      ok: true,
      method: result.method,
      message: "إذا كان البريد مسجّلاً ستصلك رسالة على الجيميل بكلمة المرور. إذا كانت أول مرة، أكّد الرسالة ثم أعد المحاولة.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إرسال الرسالة.";
    return NextResponse.json(
      { error: "تعذر إرسال الرسالة إلى الجيميل. تحقق من إعداد البريد أو أعد المحاولة." , detail: message },
      { status: 500 },
    );
  }
}
