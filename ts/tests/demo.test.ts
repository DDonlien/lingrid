import { describe, expect, it } from "vitest";
import { createDemoProject } from "../renderer/demo";
import { OPENAI_COMPATIBLE_PRESETS } from "../renderer/providers/presets";

describe("demo project", () => {
  it("uses the localized source language and removes that language from columns", () => {
    const zh = createDemoProject("zh-CN");
    expect(zh.entries[0].source).toBe("开始游戏");
    expect(zh.columnOrder).not.toContain("zh-CN");
    expect(zh.columnOrder).toEqual(["en", "ja", "ko", "ru"]);

    const en = createDemoProject("en");
    expect(en.entries[0].source).toBe("Start Game");
    expect(en.columnOrder).not.toContain("en");
    expect(en.columnOrder).toEqual(["zh-CN", "ja", "ko", "ru"]);

    const ja = createDemoProject("ja");
    expect(ja.entries[0].source).toBe("ゲーム開始");
    expect(ja.columnOrder).not.toContain("ja");
    expect(ja.columnOrder).toEqual(["zh-CN", "en", "ko", "ru"]);

    expect(zh.entries.find((entry) => entry.context === "menu.continue")?.source).toBe("继续冒险");
    expect(en.entries.find((entry) => entry.context === "menu.continue")?.source).toBe("Continue");
    expect(ja.entries.find((entry) => entry.context === "menu.continue")?.source).toBe("つづきから");
  });

  it("includes Korean, Russian, and punctuation-oriented demo entries", () => {
    const project = createDemoProject("zh-CN");
    expect(project.columnLabels.ko).toBe("한국어");
    expect(project.columnLabels.ru).toBe("Русский");
    expect(project.entries.find((entry) => entry.context === "location.enter")?.source).toBe("进入：地点");
    expect(project.entries.find((entry) => entry.context === "item.use.confirm")?.source).toBe("要使用“道具”吗？");
  });
});

describe("provider presets", () => {
  it("uses the current MiniMax OpenAI-compatible endpoint", () => {
    expect(OPENAI_COMPATIBLE_PRESETS.find((preset) => preset.id === "minimax")?.endpoint)
      .toBe("https://api.minimaxi.com/v1/chat/completions");
  });
});
