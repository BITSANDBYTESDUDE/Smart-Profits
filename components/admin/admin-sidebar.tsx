"use client";

import { Globe, LayoutDashboard, LogOut, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { AppearanceToggles } from "@/components/layout/appearance-toggles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/context/admin-auth";
import { useAdminPortal } from "@/context/admin-portal";
import { useAppearance } from "@/context/appearance";
import type { DateRangeKey } from "@/lib/admin/config";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", key: "admin.nav.overview" as const, icon: LayoutDashboard },
  { href: "/admin/financials", key: "admin.nav.financials" as const, icon: Wallet },
  { href: "/admin/users", key: "admin.nav.users" as const, icon: Users },
  { href: "/admin/traffic", key: "admin.nav.traffic" as const, icon: Globe },
];

const RANGES: DateRangeKey[] = ["today", "week", "month", "year", "custom"];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, admin } = useAdminAuth();
  const { range, from, to, setRange, setCustomRange } = useAdminPortal();
  const { t } = useAppearance();

  return (
    <aside className="sticky top-0 flex h-screen w-[300px] shrink-0 flex-col overflow-y-auto border-e border-border bg-card px-4 py-5">
      <Logo size="sm" tagline={t("admin.tagline")} />
      <p className="mt-3 text-[11px] leading-5 text-muted">{t("admin.watch")}</p>
      <div className="mt-4">
        <AppearanceToggles />
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-border bg-black/[0.03] p-3 dark:bg-white/3">
        <p className="mb-2 text-xs font-medium text-foreground">{t("admin.range")}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {RANGES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "rounded-lg px-2 py-1.5 text-[11px] transition",
                range === key ? "bg-accent text-slate-950" : "bg-black/5 text-muted hover:text-foreground dark:bg-white/5",
              )}
            >
              {t(`admin.${key}`)}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="mt-3 space-y-2">
            <Input type="date" value={from} onChange={(event) => setCustomRange(event.target.value, to)} className="h-9 text-xs" />
            <Input type="date" value={to} onChange={(event) => setCustomRange(from, event.target.value)} className="h-9 text-xs" />
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <p className="mb-2 truncate px-1 text-xs text-muted">{admin?.name}</p>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted"
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>
    </aside>
  );
}
