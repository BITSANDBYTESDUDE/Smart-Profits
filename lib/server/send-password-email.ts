export async function sendPasswordEmail(to: string, password: string, fullName: string) {
  const subject = "كلمة المرور الخاصة بحسابك في Smart Profits";
  const text = `مرحباً ${fullName || ""}،

طلبت استعادة كلمة المرور لحساب Smart Profits.

كلمة المرور الخاصة بحسابك هي:
${password}

إذا لم تطلب هذه الرسالة، تجاهلها.

Smart Profits`;

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: "Smart Profits",
      _subject: subject,
      _template: "box",
      message: text,
    }),
  });

  if (!response.ok) {
    throw new Error("تعذر إرسال الرسالة إلى البريد.");
  }

  return { ok: true as const, method: "email" as const };
}
