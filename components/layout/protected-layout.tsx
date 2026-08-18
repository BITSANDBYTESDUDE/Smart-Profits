"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGuard } from "@/components/layout/auth-guard";
import { ClassificationClarifier } from "@/components/analysis/classification-clarifier";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="min-w-0 flex-1 overflow-x-hidden">
          <ClassificationClarifier />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
