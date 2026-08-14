"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { AppearanceToggles } from "@/components/layout/appearance-toggles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/context/admin-auth";
import { useAppearance } from "@/context/appearance";
import { DEFAULT_ADMIN } from "@/lib/admin/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const { admin, ready, login } = useAdminAuth();
  const { t } = useAppearance();

  useEffect(() => {
    if (ready && admin) router.replace("/admin");
  }, [admin, ready, router]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!login(email, password)) {
      toast.error(t("admin.badLogin"));
      return;
    }
    toast.success(t("admin.welcome"));
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <section className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex flex-col gap-4">
            <Logo size="lg" tagline={t("admin.tagline.login")} />
            <AppearanceToggles />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">{t("admin.login.title")}</h1>
          <p className="mt-2 text-sm leading-7 text-muted">{t("admin.login.subtitle")}</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">{t("admin.login.email")}</Label>
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
              <Label htmlFor="password">{t("admin.login.password")}</Label>
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
              {t("admin.login.submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t("admin.login.merchant")}{" "}
            <Link href="/login" className="text-accent hover:underline">
              {t("admin.login.merchantLink")}
            </Link>
          </p>
        </div>
      </section>

      <div className="relative hidden min-h-screen overflow-hidden bg-background lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="bg-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-primary/10" />
        <div className="absolute start-16 top-24 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute end-10 bottom-20 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10 mx-10 max-w-md rounded-3xl border border-primary/20 bg-background/70 p-8 shadow-2xl backdrop-blur-md">
          <Logo size="lg" tagline={t("admin.tagline.login")} />
          <h2 className="mt-6 text-2xl font-bold leading-10 text-foreground">{t("admin.brain")}</h2>
          <p className="mt-3 text-sm leading-7 text-muted">{t("admin.brain.body")}</p>
        </div>
      </div>
    </div>
  );
}
