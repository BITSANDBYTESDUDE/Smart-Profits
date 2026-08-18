"use client";

import { Lock, Mail, Phone, Store, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useAppearance } from "@/context/appearance";
import { normalizeMobile } from "@/lib/phone";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useAppearance();
  const [accepted, setAccepted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("fullName") || "").trim();
    const storeName = String(data.get("storeName") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = normalizeMobile(String(data.get("phone") || ""));
    const password = String(data.get("password") || "");

    if (!fullName || !storeName || !email || !phone || password.length < 6) {
      toast.error(phone ? t("auth.needFields") : t("auth.phone.invalid"));
      return;
    }
    if (!accepted) {
      toast.error(t("auth.needTerms"));
      return;
    }

    register({ fullName, storeName, email, phone, password })
      .then(() => {
        toast.success(t("auth.registered"));
        router.push("/dashboard");
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error && error.message === "phone-taken" ? t("auth.phone.taken") : t("auth.needFields"));
      });
  }

  return (
    <AuthShell compact>
      <h1 className="text-lg font-bold text-foreground sm:text-xl">{t("auth.register.title")}</h1>
      <p className="mt-0.5 text-xs text-muted">{t("auth.register.subtitle")}</p>

      <form className="mt-3 space-y-2" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="fullName" className="mb-0.5 text-[11px]">{t("auth.fullName")}</Label>
          <div className="relative">
            <User className="pointer-events-none absolute end-3 top-2 h-4 w-4 text-slate-500" />
            <Input id="fullName" name="fullName" placeholder={t("auth.placeholder.name")} className="h-9 pe-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="storeName" className="mb-0.5 text-[11px]">{t("auth.storeName")}</Label>
          <div className="relative">
            <Store className="pointer-events-none absolute end-3 top-2 h-4 w-4 text-slate-500" />
            <Input id="storeName" name="storeName" placeholder={t("auth.placeholder.store")} className="h-9 pe-10" />
          </div>
        </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="email" className="mb-0.5 text-[11px]">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute end-3 top-2 h-4 w-4 text-slate-500" />
            <Input id="email" name="email" type="email" placeholder="example@gmail.com" className="h-9 pe-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="phone" className="mb-0.5 text-[11px]">{t("auth.phone")}</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute end-3 top-2 h-4 w-4 text-slate-500" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              title={t("auth.phone.hint")}
              placeholder={t("auth.placeholder.phone")}
              className="h-9 pe-10 text-start"
            />
          </div>
        </div>
        </div>
        <div>
          <Label htmlFor="password" className="mb-0.5 text-[11px]">{t("auth.password")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute end-3 top-2 h-4 w-4 text-slate-500" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="h-9 pe-10" />
          </div>
        </div>

        <label className="flex items-start gap-2 text-[11px] leading-4 text-muted">
          <input
            type="checkbox"
            className="mt-0.5 accent-accent"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            {t("auth.accept")} <span className="text-accent">{t("auth.terms")}</span> {t("auth.and")}{" "}
            <span className="text-accent">{t("auth.privacy")}</span>
          </span>
        </label>

        <Button type="submit" variant="accent" className="h-9 w-full">
          {t("auth.create")}
        </Button>
      </form>

      <p className="mt-2 text-center text-[11px] text-muted">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t("auth.login.title")}
        </Link>
        <span className="mx-2">·</span>
        <Link href="/forgot-password" className="text-accent hover:underline">
          {t("auth.forgot")}
        </Link>
      </p>
    </AuthShell>
  );
}
