import { describe, expect, it } from "vitest";
import { toDeepLTargetLanguage } from "../renderer/providers/deepl";
import { stripThinkTags } from "../renderer/providers/openai-compatible";
import { AI_DEFAULT, loadAiSettings, saveAiSettings } from "../renderer/App";

describe("DeepL language code mapping", () => {
  it("maps zh-CN / zh-Hans / zh to ZH-HANS", () => {
    expect(toDeepLTargetLanguage("zh-CN")).toBe("ZH-HANS");
    expect(toDeepLTargetLanguage("zh-Hans")).toBe("ZH-HANS");
    expect(toDeepLTargetLanguage("zh")).toBe("ZH-HANS");
  });

  it("maps ja to JA", () => {
    expect(toDeepLTargetLanguage("ja")).toBe("JA");
    expect(toDeepLTargetLanguage("JA")).toBe("JA");
  });

  it("maps English variants", () => {
    expect(toDeepLTargetLanguage("en")).toBe("EN-US");
    expect(toDeepLTargetLanguage("en-GB")).toBe("EN-GB");
    expect(toDeepLTargetLanguage("en-US")).toBe("EN-US");
  });

  it("maps Portuguese variants", () => {
    expect(toDeepLTargetLanguage("pt")).toBe("PT-PT");
    expect(toDeepLTargetLanguage("pt-BR")).toBe("PT-BR");
    expect(toDeepLTargetLanguage("pt-PT")).toBe("PT-PT");
  });

  it("is case-insensitive on input", () => {
    expect(toDeepLTargetLanguage("FR")).toBe("FR");
    expect(toDeepLTargetLanguage("DE")).toBe("DE");
    expect(toDeepLTargetLanguage("KO")).toBe("KO");
  });

  it("trims whitespace", () => {
    expect(toDeepLTargetLanguage("  ja  ")).toBe("JA");
    expect(toDeepLTargetLanguage("\tzh-CN\n")).toBe("ZH-HANS");
  });

  it("falls back to uppercased input for unknown languages", () => {
    expect(toDeepLTargetLanguage("tlh")).toBe("TLH");
  });
});

const OPEN = "<think>";
const CLOSE = "</think>";

describe("stripThinkTags", () => {
  it("removes a single think block and reports stripping", () => {
    const raw = `${OPEN}user wants Japanese${CLOSE}\n続ける`;
    const { text, stripped } = stripThinkTags(raw);
    expect(text).toBe("続ける");
    expect(stripped).toBe(true);
  });

  it("removes a think block with newlines inside", () => {
    const raw = `${OPEN}docs.md\nThe user wants Japanese${CLOSE}\nドキュメントを保存`;
    const { text } = stripThinkTags(raw);
    expect(text).toBe("ドキュメントを保存");
  });

  it("returns raw content unchanged when no think tag is present", () => {
    const raw = "ドキュメントを保存";
    const { text, stripped } = stripThinkTags(raw);
    expect(text).toBe("ドキュメントを保存");
    expect(stripped).toBe(false);
  });

  it("falls back to the trimmed raw when stripping leaves nothing", () => {
    const raw = `${OPEN}only thinking, no final answer${CLOSE}`;
    const { text, stripped } = stripThinkTags(raw);
    expect(text).toBe("only thinking, no final answer");
    expect(stripped).toBe(false);
  });

  it("returns empty text when input is whitespace only", () => {
    const { text, stripped } = stripThinkTags("   \n\t  ");
    expect(text).toBe("");
    expect(stripped).toBe(false);
  });

  it("handles multiple think blocks", () => {
    const raw = `${OPEN}A${CLOSE}first${OPEN}B${CLOSE}second`;
    const { text } = stripThinkTags(raw);
    expect(text).toContain("first");
    expect(text).toContain("second");
  });
});


describe("AI settings persistence (localStorage)", () => {
  function fakeStorage(): Storage & { data: Record<string, string> } {
    const data: Record<string, string> = {};
    return {
      data,
      getItem: (key: string) => (key in data ? data[key] : null),
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
      removeItem: (key: string) => {
        delete data[key];
      },
      clear: () => {
        for (const key of Object.keys(data)) delete data[key];
      },
      key: (index: number) => Object.keys(data)[index] ?? null,
      get length() {
        return Object.keys(data).length;
      },
    } as Storage & { data: Record<string, string> };
  }

  it("saveAiSettings writes a JSON blob", () => {
    const storage = fakeStorage();
    saveAiSettings({ ...AI_DEFAULT, apiKey: "sk-test", model: "MiniMax-M2.7" }, storage);
    expect(storage.data["lingrid-ai-settings"]).toContain("sk-test");
    expect(storage.data["lingrid-ai-settings"]).toContain("MiniMax-M2.7");
  });

  it("loadAiSettings round-trips through saveAiSettings", () => {
    const storage = fakeStorage();
    const written: typeof AI_DEFAULT = { ...AI_DEFAULT, provider: "deepl", deeplRegion: "pro", endpoint: "https://api.deepl.com/v2/translate", apiKey: "x-xxxx-xxxx-xxxx", model: "", prompt: AI_DEFAULT.prompt };
    saveAiSettings(written, storage);
    expect(loadAiSettings(storage)).toEqual(written);
  });

  it("loadAiSettings returns AI_DEFAULT when storage is empty", () => {
    const storage = fakeStorage();
    expect(loadAiSettings(storage)).toEqual(AI_DEFAULT);
  });

  it("loadAiSettings falls back to defaults for fields missing in stored data", () => {
    // Simulate an older saved entry from before we added provider / deeplRegion.
    const storage = fakeStorage();
    storage.setItem("lingrid-ai-settings", JSON.stringify({ apiKey: "kept", endpoint: "https://kept", model: "kept" }));
    const loaded = loadAiSettings(storage);
    expect(loaded.apiKey).toBe("kept");
    expect(loaded.provider).toBe(AI_DEFAULT.provider);
    expect(loaded.deeplRegion).toBe(AI_DEFAULT.deeplRegion);
    expect(loaded.prompt).toBe(AI_DEFAULT.prompt);
  });

  it("loadAiSettings returns AI_DEFAULT when stored JSON is corrupt", () => {
    const storage = fakeStorage();
    storage.setItem("lingrid-ai-settings", "not-json{{");
    expect(loadAiSettings(storage)).toEqual(AI_DEFAULT);
  });

  it("saveAiSettings swallows storage exceptions", () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
      removeItem: () => {},
    };
    expect(() => saveAiSettings(AI_DEFAULT, broken)).not.toThrow();
  });
});
