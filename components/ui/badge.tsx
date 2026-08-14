import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "success" | "danger" | "info" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-white/5 text-slate-300",
    success: "bg-emerald-500/15 text-emerald-400",
    danger: "bg-red-500/15 text-red-400",
    info: "bg-blue-500/15 text-blue-400",
    warning: "bg-amber-500/15 text-amber-400",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
