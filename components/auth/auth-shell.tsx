"use client";

import { TrendingUp } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function AuthBrandPanel() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-[#07111f] lg:flex lg:w-1/2 lg:items-center lg:justify-center">
      <div className="bg-grid-fade absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-emerald-500/10" />
      <div className="absolute start-16 top-24 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute end-10 bottom-20 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 mx-10 max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent">
          <TrendingUp className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold leading-10 text-white">مستشار التاجر الذكي</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          من ملف Excel فوضوي إلى قرار تجاري: تشخيص صحة المتجر، كشف تسريب الربح، محاكاة السعر، وخطة 30 يوماً.
        </p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <section className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          {children}
        </div>
      </section>
      <AuthBrandPanel />
    </div>
  );
}
