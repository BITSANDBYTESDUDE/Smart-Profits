"use client";

import {
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  Plus,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { FileArchiveList } from "@/components/layout/file-archive";
import { AppearanceToggles } from "@/components/layout/appearance-toggles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useAnalysis } from "@/context/analysis-context";
import { useAppearance } from "@/context/appearance";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { actionLog } = useAnalysis();
  const { t } = useAppearance();

  const nav = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/simulator", label: t("nav.simulator"), icon: SlidersHorizontal },
    { href: "/advisor", label: t("nav.advisor"), icon: MessageCircleQuestion },
    { href: "/data", label: t("nav.data"), icon: FolderOpen },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[320px] shrink-0 flex-col overflow-y-auto border-e border-border bg-card px-4 py-5">
      <Logo size="md" tagline={t("brand.tagline")} />
      <div className="mt-4">
        <AppearanceToggles />
      </div>

      <Button className="mt-6 w-full" onClick={() => router.push("/data?new=1")}>
        <Plus className="h-4 w-4" />
        {t("nav.newAnalysis")}
      </Button>

      <nav className="mt-6 flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-primary/15 text-foreground shadow-[inset_3px_0_0_var(--primary)] rtl:shadow-[inset_-3px_0_0_var(--primary)]"
                  : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/settings" && actionLog.length > 0 && (
                <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                  {actionLog.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <FileArchiveList compact />
      </div>

      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
