"use client";

import { Lock, Mail, Store, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useAnalysis } from "@/context/analysis-context";
import { trackPlatform } from "@/lib/admin/track";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { saveSettings, settings } = useAnalysis();
  const [accepted, setAccepted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("fullName") || "").trim();
    const storeName = String(data.get("storeName") || "").trim();
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!fullName || !storeName || !email || password.length < 6) {
      toast.error("أكمل جميع الحقول. كلمة المرور 6 أحرف على الأقل.");
      return;
    }
    if (!accepted) {
      toast.error("يجب الموافقة على الشروط والأحكام.");
      return;
    }

    register({ fullName, storeName, email, password }).catch(() => undefined);
    saveSettings({ ...settings, storeName, ownerName: fullName });
    trackPlatform("register", storeName);
    toast.success("تم إنشاء الحساب. مرحباً بك في SmartProfit.");
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="mt-10 text-3xl font-bold text-white">ابدأ رحلة نموك</h1>
      <p className="mt-2 text-sm text-muted">أنشئ حسابك الآن وتحكم في أرباحك بذكاء</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <div className="relative">
            <User className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="fullName" name="fullName" placeholder="أحمد محمد" className="pe-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="storeName">اسم المتجر</Label>
          <div className="relative">
            <Store className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="storeName" name="storeName" placeholder="متجري للتجارة" className="pe-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="email" name="email" type="email" placeholder="example@gmail.com" className="pe-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pe-10" />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            className="mt-1 accent-accent"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            أوافق على{" "}
            <span className="text-accent">الشروط والأحكام</span> و{" "}
            <span className="text-accent">سياسة الخصوصية</span>
          </span>
        </label>

        <Button type="submit" variant="accent" size="lg" className="w-full">
          إنشاء حساب
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="text-accent hover:underline">
          تسجيل الدخول
        </Link>
        <span className="mx-2">·</span>
        <Link href="/forgot-password" className="text-accent hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </p>
    </AuthShell>
  );
}
