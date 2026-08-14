import { NextResponse } from "next/server";
import { runFullAnalysis } from "@/lib/analytics";
import { parseFinancialFile } from "@/lib/parser";
import { DEFAULT_SETTINGS } from "@/lib/sample-data";
import { FileParseError } from "@/lib/types";
import type { AppSettings } from "@/lib/types";
import { normalizeOpexSettings } from "@/lib/opex";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم إرفاق ملف للتحليل." }, { status: 400 });
    }

    const settingsRaw = form.get("settings");
    const settings: AppSettings = settingsRaw
      ? normalizeOpexSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(String(settingsRaw)) })
      : DEFAULT_SETTINGS;

    const parsed = await parseFinancialFile(file);
    const result = runFullAnalysis(parsed, settings);

    return NextResponse.json({
      fileName: parsed.fileName,
      rowCount: parsed.rowCount,
      mapping: parsed.mapping,
      warnings: parsed.warnings,
      result,
    });
  } catch (error) {
    const message = error instanceof FileParseError || error instanceof Error
      ? error.message
      : "فشل تحليل الملف.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
