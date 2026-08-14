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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useAnalysis } from "@/context/analysis-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "لوحة التحكم والتشخيص", icon: LayoutDashboard },
  { href: "/simulator", label: "محاكي القرارات والتوقعات", icon: SlidersHorizontal },
  { href: "/advisor", label: "اسأل المستشار", icon: MessageCircleQuestion },
  { href: "/data", label: "إدارة الملفات والبيانات", icon: FolderOpen },
  { href: "/settings", label: "التقارير والإعدادات", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { actionLog } = useAnalysis();

  return (
    <aside className="sticky top-0 flex h-screen w-[270px] shrink-0 flex-col overflow-y-auto border-s border-border bg-[#0b1220] px-4 py-5">
      <Logo />

      <Button className="mt-6 w-full" onClick={() => router.push("/data?new=1")}>
        <Plus className="h-4 w-4" />
        تحليل جديد
      </Button>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          خروج
        </button>
      </div>
    </aside>
  );
}
