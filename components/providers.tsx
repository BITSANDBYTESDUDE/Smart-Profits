"use client";

import { Toaster } from "sonner";
import { AdminAuthProvider } from "@/context/admin-auth";
import { AnalysisProvider } from "@/context/analysis-context";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AnalysisProvider>
          {children}
          <Toaster theme="dark" position="top-center" richColors dir="rtl" />
        </AnalysisProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
