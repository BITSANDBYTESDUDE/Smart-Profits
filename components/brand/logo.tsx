import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  tagline,
  size = "md",
}: {
  className?: string;
  compact?: boolean;
  tagline?: string;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "lg" ? 180 : size === "sm" ? 80 : 128;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/brand/mark.png"
        alt="Smart Profits"
        width={px}
        height={px}
        className="shrink-0 bg-transparent object-contain"
        style={{ width: px, height: px }}
      />
      {!compact && (
        <div>
          <p className={cn("font-bold tracking-tight text-foreground", size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl")}>
            Smart Profits
          </p>
          <p className={cn("leading-5 text-primary", size === "lg" ? "mt-1 text-sm" : "text-xs")}>
            {tagline ?? "من ملف فوضوي إلى قرار ذكي"}
          </p>
        </div>
      )}
    </div>
  );
}
