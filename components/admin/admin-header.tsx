"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/context/admin-auth";
import { useAdminPortal } from "@/context/admin-portal";
import { RANGE_LABELS } from "@/lib/admin/config";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<string, string> = {
  success: "bg-accent",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-primary",
};

export function AdminHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { admin } = useAdminAuth();
  const { snapshot, range } = useAdminPortal();
  const [open, setOpen] = useState(false);
  const alerts = snapshot?.alerts ?? [];
  const initial = (admin?.name ?? "م").slice(0, 1);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {subtitle} • {RANGE_LABELS[range]}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-slate-300 hover:bg-white/5"
            aria-label="التنبيهات"
            onClick={() => setOpen((value) => !value)}
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -start-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] text-white">
                {alerts.length}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute end-0 z-30 mt-2 w-80 rounded-2xl border border-border bg-[#0f172a] p-3 shadow-2xl">
              <p className="mb-2 text-sm font-medium text-white">تنبيهات فورية</p>
              <ul className="space-y-2">
                {alerts.map((alert) => (
                  <li key={alert.id} className="rounded-xl bg-white/4 p-3">
                    <p className="flex items-start gap-2 text-sm text-slate-200">
                      <i className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", TONE_DOT[alert.tone])} />
                      {alert.text}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">{alert.time}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Badge tone="info">مديرة المشروع</Badge>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-sm font-semibold text-white">
          {initial}
        </div>
      </div>
    </header>
  );
}
