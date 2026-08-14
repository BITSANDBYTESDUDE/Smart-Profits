"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/analysis-context";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

const STATUS_LABEL = {
  rising: "صاعد",
  stable: "مستقر",
  declining: "متراجع",
} as const;

export function ProductTables() {
  const { result, currency } = useAnalysis();
  if (!result) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>المنتجات الأعلى مبيعاً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.topProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between rounded-xl bg-white/3 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-muted">{formatMoney(product.revenue, currency)}</p>
                </div>
                <Badge
                  tone={product.status === "rising" ? "success" : product.status === "declining" ? "danger" : "info"}
                >
                  {STATUS_LABEL[product.status]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تنبيهات المخزون الراكد</CardTitle>
        </CardHeader>
        <CardContent>
          {result.stagnantInventory.length === 0 ? (
            <p className="text-sm text-muted">لا توجد منتجات راكدة في الفترة الحالية.</p>
          ) : (
            <div className="space-y-3">
              {result.stagnantInventory.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-white/3 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-muted">{item.daysStagnant} يوماً بدون حركة</p>
                  </div>
                  <Button
                    size="sm"
                    variant={item.suggestedAction === "liquidate" ? "destructive" : "default"}
                    onClick={() =>
                      toast.message(
                        item.suggestedAction === "liquidate"
                          ? "توصية: صفّر المخزون عبر تخفيض تصفية."
                          : "توصية: طبّق خصم 20% لتحريك المنتج.",
                      )
                    }
                  >
                    {item.suggestedAction === "liquidate" ? "تصفية المخزون" : "تطبيق خصم 20%"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
