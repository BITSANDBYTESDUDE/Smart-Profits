import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  tagline,
}: {
  className?: string;
  compact?: boolean;
  tagline?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
        <BarChart3 className="h-5 w-5" />
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">Smart Profits</p>
          <p className="text-[10px] leading-4 text-slate-400">{tagline ?? "من ملف فوضوي إلى قرار ذكي"}</p>
        </div>
      )}
    </div>
  );
}
