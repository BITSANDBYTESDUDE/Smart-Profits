"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGuard } from "@/components/layout/auth-guard";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
      </div>
    </AuthGuard>
  );
}
