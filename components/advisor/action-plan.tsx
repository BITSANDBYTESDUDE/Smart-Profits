"use client";

import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";

export function ActionPlan() {
  const { result } = useAnalysis();
  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-accent" />
          خطة تحسين الأرباح — 30 يوماً
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {result.advisor.plan.map((week) => (
          <div key={week.week} className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-white">
              الأسبوع {week.week} — {week.title}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {week.tasks.map((task) => (
                <li key={task}>• {task}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
