"use client";

import { Globe, LayoutDashboard, LogOut, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/context/admin-auth";
import { useAdminPortal } from "@/context/admin-portal";
import type { DateRangeKey } from "@/lib/admin/config";
import { RANGE_LABELS } from "@/lib/admin/config";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "اللوحة العامة", icon: LayoutDashboard },
  { href: "/admin/financials", label: "المالية والخزينة", icon: Wallet },
  { href: "/admin/users", label: "المستخدمون والاستمرارية", icon: Users },
  { href: "/admin/traffic", label: "المرور والاستخدام", icon: Globe },
];

const RANGES: DateRangeKey[] = ["today", "week", "month", "year", "custom"];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, admin } = useAdminAuth();
  const { range, from, to, setRange, setCustomRange } = useAdminPortal();

  return (
    <aside className="sticky top-0 flex h-screen w-[270px] shrink-0 flex-col overflow-y-auto border-s border-border bg-[#0b1220] px-4 py-5">
      <Logo tagline="Super Admin Portal" />
      <p className="mt-3 text-[11px] leading-5 text-slate-500">محيط المراقبة الشامل لمنصة Smart Profits</p>

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
                  ? "bg-primary/15 text-white shadow-[inset_-3px_0_0_#3b82f6]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-border bg-white/3 p-3">
        <p className="mb-2 text-xs font-medium text-slate-300">فترة البيانات</p>
        <div className="grid grid-cols-2 gap-1.5">
          {RANGES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "rounded-lg px-2 py-1.5 text-[11px] transition",
                range === key ? "bg-accent text-white" : "bg-white/5 text-slate-400 hover:text-white",
              )}
            >
              {RANGE_LABELS[key]}
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
        <p className="mb-2 truncate px-1 text-xs text-slate-500">{admin?.name}</p>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400"
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          خروج
        </Button>
      </div>
    </aside>
  );
}
