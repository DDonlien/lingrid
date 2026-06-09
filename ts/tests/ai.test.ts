import { describe, expect, it } from "vitest";
import { aiLanguageLabel, rateLimitRetryDelayMs, renderAiPromptTemplate, runAdaptiveConcurrentBatch } from "../core/ai";

describe("AI prompt template rendering", () => {
  it("uses the configured column label for {{language}}", () => {
    expect(aiLanguageLabel("ja", { ja: "日本語" })).toBe("日本語");
    expect(renderAiPromptTemplate({
      template: "Translate to {{language}}: {{source}}",
      language: "ja",
      source: "Start Game",
      columnLabels: { ja: "日本語" },
    })).toBe("Translate to 日本語: Start Game");
  });

  it("falls back to the language id when the display label is missing or blank", () => {
    expect(aiLanguageLabel("zh-CN", {})).toBe("zh-CN");
    expect(aiLanguageLabel("en", { en: "   " })).toBe("en");
  });

  it("replaces all language and source placeholders", () => {
    expect(renderAiPromptTemplate({
      template: "{{language}}\n{{source}}\n{{language}}\n{{source}}",
      language: "fr",
      source: "Save Project",
      columnLabels: { fr: "Français" },
    })).toBe("Français\nSave Project\nFrançais\nSave Project");
  });
});

describe("adaptive AI batch concurrency", () => {
  it("parses provider retry hints from 429 bodies", () => {
    expect(rateLimitRetryDelayMs(429, "Please retry in 21.358663766s.")).toBe(21359);
    expect(rateLimitRetryDelayMs(500, "Please retry in 21s.")).toBeUndefined();
  });

  it("runs concurrent requests, then retries rate-limited items after waiting", async () => {
    let active = 0;
    let maxActive = 0;
    const attempts = new Map<number, number>();
    const slept: number[] = [];
    const written: number[] = [];
    const summary = await runAdaptiveConcurrentBatch({
      items: [0, 1, 2, 3],
      initialConcurrency: 3,
      retryDelayMs: (error) => rateLimitRetryDelayMs((error as { status?: number }).status, (error as { bodyPreview?: string }).bodyPreview),
      sleep: async (ms) => { slept.push(ms); },
      worker: async (item) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        active -= 1;
        const attempt = attempts.get(item) ?? 0;
        attempts.set(item, attempt + 1);
        if (item === 1 && attempt === 0) throw { status: 429, bodyPreview: "Please retry in 1.5s." };
        return item;
      },
      onSuccess: (item) => written.push(item),
    });
    expect(maxActive).toBeGreaterThan(1);
    expect(slept).toEqual([1500]);
    expect(summary).toMatchObject({ total: 4, written: 4, skipped: 0, failed: 0, retries: 1, rateLimited: true });
    expect(written.sort()).toEqual([0, 1, 2, 3]);
  });
});
