"use client";

import { Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/context/admin-auth";
import { DEFAULT_ADMIN } from "@/lib/admin/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const { admin, ready, login } = useAdminAuth();

  useEffect(() => {
    if (ready && admin) router.replace("/admin");
  }, [admin, ready, router]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!login(email, password)) {
      toast.error("بيانات مديرة المشروع غير صحيحة.");
      return;
    }
    toast.success("مرحباً بك في لوحة Super Admin.");
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <section className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Logo tagline="Internal Admin Dashboard" />
          <h1 className="mt-10 text-3xl font-bold text-white">دخول الإدارة</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            Super Admin Portal — مراقبة الدخل، المصاريف، التسجيلات، الاستمرارية، والزوار لمنصة Smart Profits.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">بريد مديرة المشروع</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={DEFAULT_ADMIN.email}
                placeholder={DEFAULT_ADMIN.email}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue={DEFAULT_ADMIN.password}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" variant="accent" size="lg" className="w-full">
              دخول لوحة التحكم
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            تاجر؟{" "}
            <Link href="/login" className="text-accent hover:underline">
              تسجيل دخول المتجر
            </Link>
          </p>
        </div>
      </section>

      <div className="relative hidden min-h-screen overflow-hidden bg-[#07111f] lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="bg-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-emerald-500/10" />
        <div className="relative z-10 mx-10 max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold leading-10 text-white">العقل المدبر للمنصة</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            أربع صفحات فقط: نظرة عامة، الخزينة، المستخدمون والاستمرارية، وحركة المرور واستخدام الميزات.
          </p>
        </div>
      </div>
    </div>
  );
}
