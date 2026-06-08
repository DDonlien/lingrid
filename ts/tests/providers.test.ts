import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestDeepLTranslation, toDeepLTargetLanguage } from "../renderer/providers/deepl";
import { ProviderHttpError, requestOpenAiCompatibleTranslation, stripThinkTags } from "../renderer/providers/openai-compatible";
import { AI_DEFAULT, loadAiSettings, saveAiSettings, switchAiSettingsProfile } from "../renderer/App";

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
    const written: typeof AI_DEFAULT = { ...AI_DEFAULT, provider: "deepl", deeplRegion: "deepl", endpoint: "https://api.deepl.com/v2/translate", apiKey: "x-xxxx-xxxx-xxxx", model: "", prompt: AI_DEFAULT.prompt };
    saveAiSettings(written, storage);
    expect(loadAiSettings(storage)).toEqual(written);
  });

  it("loadAiSettings migrates legacy DeepL free / pro regions to DeepL", () => {
    const storage = fakeStorage();
    storage.setItem("lingrid-ai-settings", JSON.stringify({ ...AI_DEFAULT, provider: "deepl", deeplRegion: "pro" }));
    expect(loadAiSettings(storage).deeplRegion).toBe("deepl");
    storage.setItem("lingrid-ai-settings", JSON.stringify({ ...AI_DEFAULT, provider: "deepl", deeplRegion: "free" }));
    expect(loadAiSettings(storage).deeplRegion).toBe("deepl");
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

describe("OpenAI-compatible provider error surfacing", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function stubFetch(status: number, statusText: string, body: string, contentType = "application/json") {
    globalThis.fetch = vi.fn(async () => new Response(body, { status, statusText, headers: { "content-type": contentType } })) as typeof fetch;
  }

  it("returns stripped text on a 2xx response", async () => {
    stubFetch(200, "OK", JSON.stringify({ choices: [{ message: { content: "  hello  " } }] }));
    const result = await requestOpenAiCompatibleTranslation({ endpoint: "https://x", apiKey: "k", model: "m", prompt: "p" });
    expect(result.text).toBe("hello");
    expect(result.strippedThink).toBe(false);
  });

  it("throws ProviderHttpError with status + body preview on non-2xx", async () => {
    stubFetch(401, "Unauthorized", JSON.stringify({ error: { message: "invalid api key" } }));
    await expect(requestOpenAiCompatibleTranslation({ endpoint: "https://x", apiKey: "k", model: "m", prompt: "p" }))
      .rejects.toMatchObject({ status: 401, bodyPreview: expect.stringContaining("invalid api key") });
  });

  it("truncates very large error bodies", async () => {
    const huge = "x".repeat(2000);
    stubFetch(500, "Internal Server Error", huge, "text/plain");
    try {
      await requestOpenAiCompatibleTranslation({ endpoint: "https://x", apiKey: "k", model: "m", prompt: "p" });
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderHttpError);
      expect((error as ProviderHttpError).bodyPreview.length).toBeLessThan(700);
      expect((error as ProviderHttpError).bodyPreview).toContain("truncated");
    }
  });
});

describe("DeepL provider error surfacing", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function stubFetch(status: number, statusText: string, body: string) {
    globalThis.fetch = vi.fn(async () => new Response(body, { status, statusText, headers: { "content-type": "application/json" } })) as typeof fetch;
  }

  it("returns translation on a 2xx response", async () => {
    stubFetch(200, "OK", JSON.stringify({ translations: [{ detected_source_language: "EN", text: "Hallo" }] }));
    const result = await requestDeepLTranslation({ endpoint: "https://x", region: "deepl", apiKey: "k", text: "Hello", targetLang: "de" });
    expect(result.text).toBe("Hallo");
    expect(result.detectedSource).toBe("EN");
  });

  it("uses the DeepLX JSON protocol and parses data responses", async () => {
    globalThis.fetch = vi.fn(async (_url, init) => {
      expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
      expect(JSON.parse(String(init?.body))).toEqual({ text: "Hello", target_lang: "DE", source_lang: "auto" });
      return new Response(JSON.stringify({ data: "Hallo" }), { status: 200, statusText: "OK", headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    const result = await requestDeepLTranslation({ endpoint: "http://localhost:1188/translate", region: "deeplx", apiKey: "", text: "Hello", targetLang: "de" });
    expect(result.text).toBe("Hallo");
  });

  it("throws ProviderHttpError on 4xx (e.g. wrong region / bad key)", async () => {
    stubFetch(403, "Forbidden", JSON.stringify({ message: "Wrong endpoint, please check your DeepL account region." }));
    try {
      await requestDeepLTranslation({ endpoint: "https://x", region: "deepl", apiKey: "k", text: "Hi", targetLang: "de" });
      throw new Error("expected throw");
    } catch (error) {
      expect((error as Error).message).toContain("403");
      expect((error as Error).message).toContain("Forbidden");
    }
  });

  it("throws ProviderHttpError on 4xx with target_lang validation error", async () => {
    stubFetch(400, "Bad Request", JSON.stringify({ message: "Value for 'target_lang' not supported." }));
    try {
      await requestDeepLTranslation({ endpoint: "https://x", region: "deepl", apiKey: "k", text: "Hi", targetLang: "xx" });
      throw new Error("expected throw");
    } catch (error) {
      expect((error as Error).message).toContain("400");
    }
  });
});

describe("AI_DEFAULT no longer seeds endpoint / model from preset", () => {
  it("AI_DEFAULT.endpoint is empty so user overrides survive preset switches", () => {
    expect(AI_DEFAULT.endpoint).toBe("");
  });
  it("AI_DEFAULT.model is empty so user overrides survive preset switches", () => {
    expect(AI_DEFAULT.model).toBe("");
  });
  it("loadAiSettings when storage is empty returns empty endpoint / model", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
    const loaded = loadAiSettings(storage);
    expect(loaded.endpoint).toBe("");
    expect(loaded.model).toBe("");
  });
});

describe("AI settings provider profiles", () => {
  it("keeps hand-edited MiniMax config separate from OpenAI config", () => {
    const minimax = switchAiSettingsProfile(AI_DEFAULT, { provider: "openai-compatible", openAiPreset: "minimax" });
    const editedMinimax = {
      ...minimax,
      endpoint: "https://api.minimaxi.com/v1/chat/completions",
      model: "MiniMax-M2.7",
      apiKey: "minimax-key",
    };
    const openai = switchAiSettingsProfile(editedMinimax, { provider: "openai-compatible", openAiPreset: "openai" });
    expect(openai.endpoint).toBe("https://api.openai.com/v1/chat/completions");
    expect(openai.model).toBe("gpt-4o-mini");
    expect(openai.apiKey).toBe("");

    const backToMinimax = switchAiSettingsProfile(openai, { provider: "openai-compatible", openAiPreset: "minimax" });
    expect(backToMinimax.endpoint).toBe("https://api.minimaxi.com/v1/chat/completions");
    expect(backToMinimax.model).toBe("MiniMax-M2.7");
    expect(backToMinimax.apiKey).toBe("minimax-key");
  });

  it("keeps DeepL endpoint separate from OpenAI-compatible presets", () => {
    const deepl = switchAiSettingsProfile(AI_DEFAULT, { provider: "deepl", deeplRegion: "deepl" });
    const editedDeepl = { ...deepl, endpoint: "https://api.deepl.com/v2/translate", apiKey: "deepl-key" };
    const openai = switchAiSettingsProfile(editedDeepl, { provider: "openai-compatible", openAiPreset: "openai" });
    expect(openai.endpoint).toBe("https://api.openai.com/v1/chat/completions");
    expect(openai.apiKey).toBe("");

    const backToDeepl = switchAiSettingsProfile(openai, { provider: "deepl", deeplRegion: "deepl" });
    expect(backToDeepl.endpoint).toBe("https://api.deepl.com/v2/translate");
    expect(backToDeepl.apiKey).toBe("deepl-key");
  });
});

describe("isKnownPlaceholderEndpoint", () => {
  it("treats empty / undefined as placeholder", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    expect(mod.isKnownPlaceholderEndpoint("")).toBe(true);
    expect(mod.isKnownPlaceholderEndpoint(undefined)).toBe(true);
    expect(mod.isKnownPlaceholderEndpoint(null)).toBe(true);
  });

  it("treats DeepL / DeepLX endpoints as placeholder (the bug fix)", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    expect(mod.isKnownPlaceholderEndpoint("https://api.deepl.com/v2/translate")).toBe(true);
    expect(mod.isKnownPlaceholderEndpoint("http://localhost:1188/translate")).toBe(true);
  });

  it("treats OpenAI preset endpoints as placeholder", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    expect(mod.isKnownPlaceholderEndpoint("https://api.openai.com/v1/chat/completions")).toBe(true);
  });

  it("treats user-typed non-preset endpoints as NOT placeholder", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    // The user's actual endpoint from this session — must NOT be a placeholder.
    expect(mod.isKnownPlaceholderEndpoint("https://api.minimaxi.com/v1/chat/completions")).toBe(false);
  });
});

describe("isKnownPlaceholderModel", () => {
  it("treats empty as placeholder", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    expect(mod.isKnownPlaceholderModel("")).toBe(true);
    expect(mod.isKnownPlaceholderModel(undefined)).toBe(true);
  });

  it("treats preset modelPlaceholders as placeholder", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    expect(mod.isKnownPlaceholderModel("MiniMax-M2.7")).toBe(true);
  });

  it("treats user-typed non-preset models as NOT placeholder", async () => {
    const mod = await import("../renderer/providers/placeholder-detect");
    expect(mod.isKnownPlaceholderModel("my-custom-fine-tuned-model-2026")).toBe(false);
  });
});
