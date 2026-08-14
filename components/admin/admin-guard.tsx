"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminAuth } from "@/context/admin-auth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { admin, ready } = useAdminAuth();

  useEffect(() => {
    if (ready && !admin) router.replace("/admin/login");
  }, [admin, ready, router]);

  if (!ready || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
        جاري التحقق من صلاحية الإدارة...
      </div>
    );
  }

  return <>{children}</>;
}
