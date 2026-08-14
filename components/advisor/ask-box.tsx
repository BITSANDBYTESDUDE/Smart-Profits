"use client";

import { useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalysis } from "@/context/analysis-context";
import { answerMerchantQuestion } from "@/lib/qa";

const HINTS = [
  "ليش ربحي هالشهر نزل؟",
  "شو أشتري أول؟",
  "وين تسريب الربح؟",
  "شو أعمل اليوم؟",
  "كيف يُحسب صافي الربح؟",
  "كيف تم حساب تكلفة الشحن؟",
];

interface ChatTurn {
  q: string;
  a: string;
}

export function AdvisorAskBox({ chat = false }: { chat?: boolean }) {
  const { result } = useAnalysis();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  function ask(next = question) {
    const text = next.trim();
    if (!text) return;
    if (!result) {
      setTurns((prev) => [
        ...prev,
        { q: text, a: "ارفع ملفاً من إدارة البيانات حتى أجاوب من أرقام متجرك، مو من كلام عام." },
      ]);
      setQuestion("");
      return;
    }
    setTurns((prev) => [...prev, { q: text, a: answerMerchantQuestion(text, result) }]);
    setQuestion("");
  }

  return (
    <Card className={chat ? "flex min-h-[520px] flex-col" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-primary" />
          اسأل المستشار بالعربي
        </CardTitle>
      </CardHeader>
      <CardContent className={chat ? "flex flex-1 flex-col gap-3" : "space-y-3"}>
        <div className="flex flex-wrap gap-2">
          {HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
              onClick={() => ask(hint)}
            >
              {hint}
            </button>
          ))}
        </div>

        <div className={chat ? "min-h-0 flex-1 space-y-3 overflow-y-auto" : "space-y-3"}>
          {turns.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-600 p-4 text-sm leading-7 text-muted">
              اكتب مثل ما تحكي: «ليش الربح نزل؟» أو «كيف تم حساب تكلفة الشحن؟». الإجابة تطلع من ملفك الحالي، مو من نموذج عام.
            </p>
          )}
          {turns.map((turn, index) => (
            <div key={`${turn.q}-${index}`} className="space-y-2">
              <p className="rounded-2xl bg-primary/15 px-4 py-2 text-sm text-white">{turn.q}</p>
              <p className="rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm leading-7 text-slate-200">{turn.a}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="اكتب سؤالك..."
            onKeyDown={(event) => {
              if (event.key === "Enter") ask();
            }}
          />
          <Button onClick={() => ask()}>
            <Send className="h-4 w-4" />
            اسأل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
