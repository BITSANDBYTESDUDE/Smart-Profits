"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { findAccount, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  async function onLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) {
      toast.error("ضع البريد الإلكتروني المسجّل.");
      return;
    }

    const account = findAccount(value);
    if (!account) {
      setFound(false);
      toast.error("هذا البريد غير موجود في المنصة. أنشئ حساباً أولاً.");
      return;
    }

    setFound(true);
    setSending(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          fullName: account.fullName,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(payload.error || "تعذر إرسال الرسالة.");
        return;
      }
      toast.success(payload.message || "تم إرسال كلمة المرور إلى بريدك.");
    } catch {
      toast.error("تعذر الاتصال بخدمة البريد. يمكنك تعيين كلمة مرور جديدة بالأسفل.");
    } finally {
      setSending(false);
    }
  }

  async function onReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const account = findAccount(email);
    if (!account) {
      toast.error("أعد إدخال البريد أولاً.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("كلمة المرور الجديدة 6 أحرف على الأقل.");
      return;
    }
    await register({ ...account, password: newPassword });
    toast.success("تم حفظ كلمة المرور الجديدة.");
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="mt-10 text-3xl font-bold text-white">نسيت كلمة المرور</h1>
      <p className="mt-2 text-sm text-muted">ضع البريد الإلكتروني. إذا كان مسجّلاً نرسل كلمة المرور إلى نفس الجيميل.</p>

      <form className="mt-8 space-y-4" onSubmit={onLookup}>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFound(false);
              }}
              placeholder="example@gmail.com"
              className="pe-10"
              required
            />
          </div>
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={sending}>
          {sending ? "جاري الإرسال..." : "إرسال كلمة المرور إلى البريد"}
        </Button>
      </form>

      {found && (
        <form className="mt-8 space-y-4 rounded-2xl border border-border p-4" onSubmit={onReset}>
          <p className="text-sm text-slate-300">البريد موجود. يمكنك أيضاً تعيين كلمة مرور جديدة من هنا:</p>
          <div>
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full">
            حفظ كلمة المرور الجديدة
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        تذكرت كلمة المرور؟{" "}
        <Link href="/login" className="text-accent hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}
