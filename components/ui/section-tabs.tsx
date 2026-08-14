"use client";

import { cn } from "@/lib/utils";

export function SectionTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-white/3 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-xl px-4 py-2 text-sm transition",
            value === tab.id ? "bg-primary text-white" : "text-slate-400 hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
