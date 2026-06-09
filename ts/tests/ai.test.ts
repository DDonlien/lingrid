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

  it("renders indexed OtherLan and OhterContent variables", () => {
    const result = renderAiPromptTemplate({
      template: "Ref: {{OtherLan_1}} = {{OhterContent_1}}, {{OtherLan_2}} = {{OhterContent_2}}",
      language: "en",
      source: "Maze",
      columnLabels: { "zh-Hans": "简体中文", ko: "한국어" },
      otherLanguages: [
        { language: "zh-Hans", content: "迷宫" },
        { language: "ko", content: "미로" },
      ],
    });
    expect(result).toBe("Ref: 简体中文 = 迷宫, 한국어 = 미로");
  });

  it("renders empty string for out-of-range indexed variables", () => {
    const result = renderAiPromptTemplate({
      template: "{{OtherLan_1}} {{OhterContent_1}} {{OtherLan_3}} {{OhterContent_3}}",
      language: "en",
      source: "X",
      columnLabels: {},
      otherLanguages: [
        { language: "ja", content: "Y" },
      ],
    });
    expect(result).toBe("ja Y  ");
  });

  it("renders aggregate OtherLan:OhterContent for paired pattern", () => {
    const result = renderAiPromptTemplate({
      template: "Others: {{OtherLan}}: {{OhterContent}}",
      language: "en",
      source: "Maze",
      columnLabels: { "zh-Hans": "ZH-HANS", ko: "KO" },
      otherLanguages: [
        { language: "zh-Hans", content: "迷宫" },
        { language: "ko", content: "미로" },
      ],
    });
    expect(result).toBe("Others: ZH-HANS: 迷宫,KO: 미로");
  });

  it("renders aggregate for standalone OtherLan and OhterContent", () => {
    const result = renderAiPromptTemplate({
      template: "A: {{OtherLan}} B: {{OhterContent}}",
      language: "en",
      source: "Maze",
      columnLabels: { ja: "JA" },
      otherLanguages: [
        { language: "ja", content: "迷路" },
      ],
    });
    expect(result).toBe("A: JA: 迷路 B: JA: 迷路");
  });

  it("renders empty aggregate when otherLanguages is empty", () => {
    const result = renderAiPromptTemplate({
      template: "Others: [{{OtherLan}}: {{OhterContent}}]",
      language: "en",
      source: "Maze",
      columnLabels: {},
      otherLanguages: [],
    });
    expect(result).toBe("Others: []");
  });

  it("renders empty aggregate when otherLanguages is omitted", () => {
    const result = renderAiPromptTemplate({
      template: "Others: [{{OtherLan}}]",
      language: "en",
      source: "Maze",
      columnLabels: {},
    });
    expect(result).toBe("Others: []");
  });

  it("uses column labels for OtherLan aggregate and indexed vars", () => {
    const result = renderAiPromptTemplate({
      template: "{{OtherLan_1}}: {{OhterContent_1}} | {{OtherLan}}",
      language: "en",
      source: "Start",
      columnLabels: { ja: "日本語", fr: "Français" },
      otherLanguages: [
        { language: "ja", content: "開始" },
        { language: "fr", content: "Début" },
      ],
    });
    expect(result).toBe("日本語: 開始 | 日本語: 開始,Français: Début");
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
