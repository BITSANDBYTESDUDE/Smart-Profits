"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/analysis-context";
import { cn } from "@/lib/utils";

const PRIORITY = {
  high: "border-red-500/30 bg-red-500/8",
  medium: "border-amber-500/30 bg-amber-500/8",
  low: "border-accent/30 bg-accent/8",
};

export function TodayActions() {
  const { result } = useAnalysis();
  if (!result) return null;
  const actions = result.advisor.todayActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          ماذا أفعل اليوم؟
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted">ثلاث قرارات فقط — ليس عشرين رسماً.</p>
        {actions.map((action, index) => (
          <div key={action.id} className={cn("rounded-xl border p-4", PRIORITY[action.priority])}>
            <p className="text-sm font-semibold text-foreground">
              {index + 1}. {action.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{action.reason}</p>
            <Link href={action.href}>
              <Button size="sm" variant="outline" className="mt-3">
                تنفيذ
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
