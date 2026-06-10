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

  // Replace language-code suffixed OtherLan/OhterContent variables (e.g. {{OtherLan_EN}}, {{OhterContent_zh-Hans}})
  result = result.replace(/\{\{OtherLan_([A-Za-z0-9-]+)\}\}/g, (_match, langCode) => {
    const normalized = langCode.toLowerCase();
    const found = others.find((item) => item.language.toLowerCase() === normalized);
    return found ? aiLanguageLabel(found.language, columnLabels) : "";
  });
  result = result.replace(/\{\{OhterContent_([A-Za-z0-9-]+)\}\}/g, (_match, langCode) => {
    const normalized = langCode.toLowerCase();
    const found = others.find((item) => item.language.toLowerCase() === normalized);
    return found ? found.content : "";
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
  autoStopped: boolean;
  consecutiveFailures: number;
}

export async function runAdaptiveConcurrentBatch<T, R>({
  items,
  worker,
  onSuccess,
  onSkip,
  onError,
  onProgress,
  onRateLimitThrottled,
  onAutoStop,
  shouldStop,
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
  onRateLimitThrottled?: (error: unknown, item: T, index: number, delayMs: number) => void;
  onAutoStop?: (summary: AdaptiveBatchSummary) => void;
  shouldStop?: () => boolean;
  retryDelayMs?: (error: unknown) => number | undefined;
  initialConcurrency?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<AdaptiveBatchSummary> {
  const CONSECUTIVE_FAILURE_THRESHOLD = 10;
  const summary: AdaptiveBatchSummary = { total: items.length, written: 0, skipped: 0, failed: 0, retries: 0, rateLimited: false, autoStopped: false, consecutiveFailures: 0 };
  let nextIndex = 0;
  let completed = 0;
  let active = 0;
  let concurrency = Math.max(1, initialConcurrency);
  let consecutiveFailures = 0;

  return new Promise((resolve) => {
    const launch = () => {
      if (completed >= items.length) {
        summary.consecutiveFailures = consecutiveFailures;
        resolve(summary);
        return;
      }
      // Auto-stop when consecutive failures reach threshold
      if (consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
        summary.autoStopped = true;
        summary.consecutiveFailures = consecutiveFailures;
        onAutoStop?.(summary);
        // Wait for active workers to finish, then resolve
        if (active === 0) {
          resolve(summary);
        }
        return;
      }
      while (active < concurrency && nextIndex < items.length) {
        // Check external cancellation or auto-stop threshold
        if (shouldStop?.() || consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
          if (consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD && !summary.autoStopped) {
            summary.autoStopped = true;
            summary.consecutiveFailures = consecutiveFailures;
            onAutoStop?.(summary);
          }
          if (active === 0) {
            resolve(summary);
          }
          return;
        }
        const index = nextIndex;
        const item = items[index];
        nextIndex += 1;
        active += 1;
        void runOne(item, index).finally(() => {
          active -= 1;
          completed += 1;
          onProgress?.(completed, items.length, { ...summary, consecutiveFailures });
          launch();
        });
      }
    };

    const runOne = async (item: T, index: number) => {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        // Check external cancellation before each attempt
        if (shouldStop?.()) return;
        try {
          const result = await worker(item, index, attempt);
          if (result === undefined) {
            summary.skipped += 1;
            onSkip?.(item, index);
          } else {
            summary.written += 1;
            onSuccess?.(result, item, index);
          }
          consecutiveFailures = 0; // Reset on any success
          return;
        } catch (error) {
          const delay = retryDelayMs?.(error);
          const isThrottled = delay !== undefined && attempt < maxRetries;
          if (isThrottled) {
            summary.retries += 1;
            summary.rateLimited = true;
            concurrency = 1;
            consecutiveFailures = 0; // Throttle is not a hard failure; reset counter
            onRateLimitThrottled?.(error, item, index, delay);
            await sleep(delay);
            continue;
          }
          // Hard failure (no retry or retry exhausted)
          summary.failed += 1;
          consecutiveFailures += 1;
          onError?.(error, item, index);
          // If this failure pushed us to the threshold, stop immediately
          if (consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
            return;
          }
          return;
        }
      }
    };

    launch();
  });
}
