"use client";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPortalProvider } from "@/context/admin-portal";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminPortalProvider>
        <div className="flex min-h-screen bg-background">
          <AdminSidebar />
          <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
        </div>
      </AdminPortalProvider>
    </AdminGuard>
  );
}
