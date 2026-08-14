"use client";

import { Logo } from "@/components/brand/logo";
import { AppearanceToggles } from "@/components/layout/appearance-toggles";
import { useAppearance } from "@/context/appearance";

export function AuthBrandPanel() {
  const { t } = useAppearance();
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-card lg:flex lg:w-1/2 lg:items-center lg:justify-center">
      <div className="bg-grid-fade absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-primary/10" />
      <div className="absolute start-16 top-24 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute end-10 bottom-20 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 mx-10 max-w-md rounded-3xl border border-primary/20 bg-background/70 p-8 shadow-2xl backdrop-blur-md">
        <Logo size="lg" tagline={t("brand.tagline")} />
        <h2 className="mt-6 text-2xl font-bold leading-10 text-foreground">{t("brand.advisor")}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{t("brand.advisor.body")}</p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useAppearance();
  return (
    <div className="flex min-h-screen bg-background">
      <section className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex flex-col gap-4">
            <Logo size="lg" tagline={t("brand.tagline")} />
            <AppearanceToggles />
          </div>
          {children}
        </div>
      </section>
      <AuthBrandPanel />
    </div>
  );
}
