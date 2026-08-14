import type { ActionLogEntry, AppSettings, ParseResult, Transaction } from "./types";

interface SerializedParseResult extends Omit<ParseResult, "transactions"> {
  transactions: Array<Omit<Transaction, "date"> & { date: string | null }>;
}

export interface PersistedFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  isDemo: boolean;
  parseResult: SerializedParseResult;
}

export interface PersistedWorkspace {
  version: 2;
  settings: AppSettings;
  activeFileId: string;
  files: PersistedFile[];
  actionLog: ActionLogEntry[];
}

export interface PersistedAnalysis {
  settings: AppSettings;
  parseResult: SerializedParseResult;
}

export function serializeParseResult(parsed: ParseResult): SerializedParseResult {
  return {
    ...parsed,
    transactions: parsed.transactions.map((tx) => ({
      ...tx,
      date: tx.date ? tx.date.toISOString() : null,
    })),
  };
}

export function deserializeParseResult(parsed: SerializedParseResult): ParseResult {
  return {
    ...parsed,
    cleaning: parsed.cleaning ?? {
      sourceRows: parsed.rowCount,
      validRows: parsed.rowCount,
      skippedRows: parsed.skippedRows,
      columnsDetected: parsed.mapping?.headers?.length ?? 0,
      columnsMapped: Object.values(parsed.mapping?.mapping ?? {}).filter(Boolean).length,
      valuesFixed: 0,
      duplicatesRemoved: 0,
      reviewNeeded: 0,
    },
    transactions: parsed.transactions.map((tx) => ({
      ...tx,
      date: tx.date ? new Date(tx.date) : null,
    })),
  };
}
