"use client";

import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Recommendations() {
  const { result, applyRecommendation, actionLog, activeFileId } = useAnalysis();
  const router = useRouter();
  if (!result) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          توصيات الذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.forecast.recommendations.map((rec) => {
          const alreadyLogged = actionLog.some(
            (entry) => entry.fileId === activeFileId && entry.recommendationId === rec.id,
          );
          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-xl border p-4",
                rec.tone === "positive" ? "border-accent/30 bg-accent/8" : "border-red-500/20 bg-red-500/8",
              )}
            >
              <h4 className={cn("text-sm font-semibold", rec.tone === "positive" ? "text-accent" : "text-red-300")}>
                {rec.title}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{rec.body}</p>
              <Button
                size="sm"
                variant={alreadyLogged ? "outline" : rec.tone === "positive" ? "accent" : "default"}
                className="mt-3"
                onClick={() => {
                  applyRecommendation(rec);
                  toast.success(
                    alreadyLogged
                      ? "هذه التوصية موجودة مسبقاً في سجل الإجراءات."
                      : "تم تسجيل التوصية في سجل الإجراءات.",
                  );
                  router.push("/settings?tab=actions");
                }}
              >
                {alreadyLogged ? "عرض في السجل" : rec.actionLabel}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
