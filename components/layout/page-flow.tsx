"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ANALYSIS_STEPS } from "@/lib/column-roles";
import { cn } from "@/lib/utils";

export function PageFlow() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs">
      {ANALYSIS_STEPS.map((step, index) => {
        const active = pathname === step.href;
        return (
          <span key={step.href} className="flex items-center gap-1">
            {index > 0 && <ChevronLeft className="h-3 w-3 text-slate-600" />}
            <Link
              href={step.href}
              className={cn(
                "rounded-lg px-2 py-1 transition",
                active ? "bg-primary/20 text-white" : "text-slate-400 hover:text-white",
              )}
            >
              {step.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
