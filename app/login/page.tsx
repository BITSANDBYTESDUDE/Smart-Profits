"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { trackPlatform } from "@/lib/admin/track";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!email || !email.includes("@")) {
      toast.error("ضع البريد الإلكتروني.");
      return;
    }
    if (password.length < 6) {
      toast.error("أدخل كلمة المرور (6 أحرف على الأقل).");
      return;
    }

    const ok = login(email, password);
    if (!ok) {
      toast.error("البريد أو كلمة المرور غير صحيحة.");
      return;
    }

    trackPlatform("login", email);
    toast.success("تم تسجيل الدخول.");
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="mt-10 text-3xl font-bold text-white">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-muted">ادخل ببريدك وكلمة المرور للعودة إلى مستشار متجرك</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="email" name="email" type="email" placeholder="example@gmail.com" className="pe-10" required />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              كلمة المرور
            </Label>
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pe-10" required />
          </div>
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full">
          دخول
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-accent hover:underline">
          إنشاء حساب
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/admin/login" className="hover:text-accent">
          دخول لوحة الإدارة (Super Admin)
        </Link>
      </p>
    </AuthShell>
  );
}
