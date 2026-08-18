"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppearance } from "@/context/appearance";
import { useAuth } from "@/context/auth-context";
import { useSmartGuard } from "@/context/smart-guard-context";
import { GuardBlockedError } from "@/lib/smart-guard/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { protect } = useSmartGuard();
  const { t } = useAppearance();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!email || !email.includes("@")) {
      toast.error(t("auth.needEmail"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.needPassword"));
      return;
    }

    const ok = await login(email, password);
    if (!ok) {
      toast.error(t("auth.badLogin"));
      return;
    }

    try {
      await protect("login", { email });
      toast.success(t("auth.loggedIn"));
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof GuardBlockedError) {
        return;
      }
      toast.success(t("auth.loggedIn"));
      router.push("/dashboard");
    }
  }

  return (
    <AuthShell>
      <h1 className="mt-8 text-3xl font-bold text-foreground">{t("auth.login.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("auth.login.subtitle")}</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-muted" />
            <Input id="email" name="email" type="email" placeholder="example@gmail.com" className="pe-10" required />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              {t("auth.password")}
            </Label>
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute end-3 top-3.5 h-4 w-4 text-muted" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pe-10" required />
          </div>
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full">
          {t("auth.enter")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="text-accent hover:underline">
          {t("auth.create")}
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted">
        <Link href="/admin/login" className="hover:text-accent">
          {t("auth.adminLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
