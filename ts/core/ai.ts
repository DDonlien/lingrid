export function aiLanguageLabel(language: string, columnLabels: Record<string, string>): string {
  const label = columnLabels[language]?.trim();
  return label || language;
}

export function renderAiPromptTemplate({
  template,
  language,
  source,
  columnLabels,
  otherLanguages,
}: {
  template: string;
  language: string;
  source: string;
  columnLabels: Record<string, string>;
  otherLanguages?: { language: string; content: string }[];
}): string {
  let result = template
    .replaceAll("{{language}}", aiLanguageLabel(language, columnLabels))
    .replaceAll("{{source}}", source);

  const others = otherLanguages ?? [];

  // Replace indexed OtherLan/OhterContent variables (1-based index)
  result = result.replace(/\{\{OtherLan_(\d+)\}\}/g, (_match, num) => {
    const idx = Number(num) - 1;
    return idx >= 0 && idx < others.length ? aiLanguageLabel(others[idx].language, columnLabels) : "";
  });
  result = result.replace(/\{\{OhterContent_(\d+)\}\}/g, (_match, num) => {
    const idx = Number(num) - 1;
    return idx >= 0 && idx < others.length ? others[idx].content : "";
  });

  // Replace aggregate OtherLan/OhterContent
  const aggregate = others.length
    ? others.map((item) => `${aiLanguageLabel(item.language, columnLabels)}: ${item.content}`).join(",")
    : "";

  // Handle paired pattern first, then individual variables
  result = result.replaceAll("{{OtherLan}}: {{OhterContent}}", aggregate);
  result = result.replaceAll("{{OtherLan}}", aggregate);
  result = result.replaceAll("{{OhterContent}}", aggregate);

  return result;
}

export function rateLimitRetryDelayMs(status: unknown, bodyPreview: unknown, fallbackMs = 2000): number | undefined {
  if (status !== 429) return undefined;
  const body = typeof bodyPreview === "string" ? bodyPreview : "";
  const retryIn = body.match(/retry\s+in\s+([\d.]+)\s*s/i)?.[1]
    ?? body.match(/retry\s+after\s+([\d.]+)\s*s/i)?.[1]
    ?? body.match(/"retry[_-]?after"\s*:\s*"?([\d.]+)"?/i)?.[1];
  const parsed = retryIn ? Number.parseFloat(retryIn) * 1000 : fallbackMs;
  if (!Number.isFinite(parsed)) return fallbackMs;
  return Math.max(250, Math.min(60_000, Math.ceil(parsed)));
}

export interface AdaptiveBatchSummary {
  total: number;
  written: number;
  skipped: number;
  failed: number;
  retries: number;
  rateLimited: boolean;
}

export async function runAdaptiveConcurrentBatch<T, R>({
  items,
  worker,
  onSuccess,
  onSkip,
  onError,
  onProgress,
  retryDelayMs,
  initialConcurrency = 4,
  maxRetries = 2,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}: {
  items: T[];
  worker: (item: T, index: number, attempt: number) => Promise<R | undefined>;
  onSuccess?: (result: R, item: T, index: number) => void;
  onSkip?: (item: T, index: number) => void;
  onError?: (error: unknown, item: T, index: number) => void;
  onProgress?: (completed: number, total: number, summary: AdaptiveBatchSummary) => void;
  retryDelayMs?: (error: unknown) => number | undefined;
  initialConcurrency?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<AdaptiveBatchSummary> {
  const summary: AdaptiveBatchSummary = { total: items.length, written: 0, skipped: 0, failed: 0, retries: 0, rateLimited: false };
  let nextIndex = 0;
  let completed = 0;
  let active = 0;
  let concurrency = Math.max(1, initialConcurrency);

  return new Promise((resolve) => {
    const launch = () => {
      if (completed >= items.length) {
        resolve(summary);
        return;
      }
      while (active < concurrency && nextIndex < items.length) {
        const index = nextIndex;
        const item = items[index];
        nextIndex += 1;
        active += 1;
        void runOne(item, index).finally(() => {
          active -= 1;
          completed += 1;
          onProgress?.(completed, items.length, { ...summary });
          launch();
        });
      }
    };

    const runOne = async (item: T, index: number) => {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          const result = await worker(item, index, attempt);
          if (result === undefined) {
            summary.skipped += 1;
            onSkip?.(item, index);
          } else {
            summary.written += 1;
            onSuccess?.(result, item, index);
          }
          return;
        } catch (error) {
          const delay = retryDelayMs?.(error);
          if (delay !== undefined && attempt < maxRetries) {
            summary.retries += 1;
            summary.rateLimited = true;
            concurrency = 1;
            await sleep(delay);
            continue;
          }
          summary.failed += 1;
          onError?.(error, item, index);
          return;
        }
      }
    };

    launch();
  });
}
