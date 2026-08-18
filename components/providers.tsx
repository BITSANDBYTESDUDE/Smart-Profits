"use client";

import { Toaster } from "sonner";
import { AdminAuthProvider } from "@/context/admin-auth";
import { AnalysisProvider } from "@/context/analysis-context";
import { AppearanceProvider, useAppearance } from "@/context/appearance";
import { AuthProvider } from "@/context/auth-context";
import { SmartGuardProvider } from "@/context/smart-guard-context";
import { SmartGuardOverlay } from "@/components/guard/smart-guard-overlay";

function ThemedToaster() {
  const { theme, dir } = useAppearance();
  return <Toaster theme={theme} position="top-center" richColors dir={dir} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <SmartGuardProvider>
            <AnalysisProvider>
              {children}
              <SmartGuardOverlay />
              <ThemedToaster />
            </AnalysisProvider>
          </SmartGuardProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}
