import { ProtectedLayout } from "@/components/layout/protected-layout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
