import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdvisorHelpCards() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>صيغة الملف المفضلة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-7 text-slate-300">
          <p>ارفع Excel حتى لو كانت الأعمدة فوضوية (سعر، Price، بيع). النظام ينظّف الصفوف ويشخّص المتجر ويقترح 3 قرارات لليوم.</p>
          <p>الأعمدة المدعومة:</p>
          <ul className="list-disc pe-5">
            <li>التاريخ / Date</li>
            <li>سعر البيع / Price / المبيعات</li>
            <li>التكلفة / Cost / المشتريات</li>
            <li>الكمية / Quantity</li>
            <li>المصروف / Expense</li>
          </ul>
          <p>يمكن كتابة الأرقام مع ر.س أو $ أو فواصل. الصور وملفات PDF الممسوحة تُقرأ إذا كانت الأعمدة واضحة.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>كيف يُحسب صافي الربح؟</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-slate-300">
          صافي الربح = إجمالي المبيعات − (تكلفة البضاعة المباعة + المصاريف التشغيلية). المصاريف الثابتة من الإعدادات تُضاف لكل شهر.
        </CardContent>
      </Card>
    </div>
  );
}
