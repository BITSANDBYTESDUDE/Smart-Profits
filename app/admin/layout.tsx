import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin | Smart Profits",
  description: "لوحة التحكم الداخلية لمنصة Smart Profits",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
