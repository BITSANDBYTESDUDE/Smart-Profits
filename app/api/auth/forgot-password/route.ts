import { NextResponse } from "next/server";
import { findAccount } from "@/lib/server/accounts";
import { isMailConfigured, sendPasswordEmail } from "@/lib/server/send-password-email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; fullName?: string };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "ضع بريداً إلكترونياً صحيحاً." }, { status: 400 });
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        {
          error:
            "بريد الإرسال غير مُعد بعد. أنشئ جيميل للتطبيق وضعي MAIL_USER و MAIL_APP_PASSWORD في .env ثم أعيدي تشغيل npm run dev. يمكنك تعيين كلمة مرور جديدة من نفس الصفحة الآن.",
        },
        { status: 503 },
      );
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
      message: `تم إرسال كلمة المرور إلى ${email} من بريد Smart Profits.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إرسال الرسالة.";
    return NextResponse.json(
      { error: "تعذر إرسال الرسالة من بريد التطبيق. تأكد من MAIL_USER وكلمة مرور التطبيق.", detail: message },
      { status: 500 },
    );
  }
}
