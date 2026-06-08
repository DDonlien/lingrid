import { describe, expect, it } from "vitest";
import { aiLanguageLabel, renderAiPromptTemplate } from "../core/ai";

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
