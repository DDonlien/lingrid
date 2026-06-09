import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { defaultCsvMapping, parseCsv, updateCsv } from "../adapters/csv";
import { detectPoLanguage, parsePo, updatePo } from "../adapters/po";
import { verifyBrowserFileWritable, writeBrowserFile } from "../core/browser-files";
import { adjacentCell, applyTranslationDrafts, canImportSourceTypes, createProject, EMPTY_TAG_FILTER, filteredEntries, mergeEntries, moveColumn, nextSortMode, normalizeProjectView, pathsReferToSameFile, projectStats, reorderColumn, serializeProject, sortedEntries } from "../core/project";
import type { LingridProject, SourceDocument, TranslationEntry } from "../core/types";

function fixture(name: string): string {
  return readFileSync(new URL(`../../fixtures/${name}`, import.meta.url), "utf8");
}

function po(name: string): SourceDocument {
  const raw = fixture(name);
  return { id: name, path: name, name, raw, type: "po", language: detectPoLanguage(raw, name), writable: true };
}

function inlinePo(language: string, entries: Array<{ source: string; value: string; comment?: string }>): SourceDocument {
  const raw = [`msgid ""\nmsgstr ""\n"Language: ${language}\\n"`, ...entries.map((entry) => `${entry.comment ? `#. ${entry.comment}\n` : ""}msgid "${entry.source}"\nmsgstr "${entry.value}"`)].join("\n\n");
  return { id: language, path: `${language}/GAME.po`, name: "GAME.po", raw, type: "po", language, writable: true };
}

describe("PO adapter", () => {
  it("reads the Language header instead of falling back to a shared PO filename", () => {
    const zhRaw = fixture("zh-CN.po");
    const jaRaw = fixture("ja.po");
    const zhLanguage = detectPoLanguage(zhRaw, "GAME.po");
    const jaLanguage = detectPoLanguage(jaRaw, "GAME.po");
    const sameNamedDocuments: SourceDocument[] = [
      { id: "zh", path: "zh-CN/GAME.po", name: "GAME.po", raw: zhRaw, type: "po", language: zhLanguage, writable: true },
      { id: "ja", path: "ja/GAME.po", name: "GAME.po", raw: jaRaw, type: "po", language: jaLanguage, writable: true },
    ];
    const merged = sameNamedDocuments.reduce<TranslationEntry[]>((entries, document) => mergeEntries(entries, parsePo(document)), []);
    expect([zhLanguage, jaLanguage]).toEqual(["zh-CN", "ja"]);
    expect(Object.keys(merged[0].translations)).toEqual(["zh-CN", "ja"]);
  });

  it("merges language documents using context and source", () => {
    const zh = parsePo(po("zh-CN.po"));
    const ja = parsePo(po("ja.po"));
    const merged = mergeEntries(zh, ja);
    expect(merged).toHaveLength(3);
    expect(merged[0].translations["zh-CN"].value).toBe("开始游戏");
    expect(merged[0].translations.ja.value).toBe("ゲーム開始");
    expect(merged.find((entry) => entry.context === "npc.arrow")?.translations["zh-CN"].value).toBe("我以前也和你一样是个冒险者，直到我的膝盖中了一箭。");
  });

  it("updates msgstr while preserving PO metadata and order", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0].translations["zh-CN"] = { value: "开始新游戏", changed: true };
    const output = updatePo(document, entries);
    expect(output).toContain('msgstr "开始新游戏"');
    expect(output).toContain("#. Main menu action");
    expect(output).toContain("#: src/menu.ts:10");
    expect(output).toContain("#, fuzzy");
    expect(output).toContain('#| msgid "Play"');
    expect(output).toContain('#~ msgid "Old option"');
    expect(output.indexOf("Start Game")).toBeLessThan(output.indexOf("Continue"));
  });

  it("writes a batch-renamed source without losing metadata", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0] = { ...entries[0], source: "Begin Game", sourceChanged: true };
    const output = updatePo(document, entries);
    expect(output).toContain('msgid "Begin Game"');
    expect(output).toContain("#. Main menu action");
  });

  it("does not write a POT template", () => {
    const raw = fixture("template.pot");
    const document: SourceDocument = { id: "pot", path: "template.pot", name: "template.pot", raw, type: "pot", writable: false };
    expect(updatePo(document, [])).toBe(raw);
  });

  it("appends a full PO block when force-filling an entry missing from the target language", () => {
    const zh = inlinePo("zh-CN", [{ source: "Shared", value: "共享" }]);
    const ja = inlinePo("ja", [{ source: "Shared", value: "共有" }, { source: "Only in ja", value: "日本語のみ", comment: "Keep this metadata" }]);
    const entries = mergeEntries(parsePo(zh), parsePo(ja));
    const missing = entries.find((entry) => !entry.translations["zh-CN"]);
    expect(missing).toBeDefined();
    missing!.translations["zh-CN"] = { value: "强制补齐", changed: true };
    const output = updatePo(zh, entries);
    expect(output).toContain(`msgid "${missing!.source}"`);
    expect(output).toContain('msgstr "强制补齐"');
    expect(output).toContain("#. Keep this metadata");
    expect(parsePo({ ...zh, raw: output }).find((entry) => entry.key === missing!.key)?.translations["zh-CN"].value).toBe("强制补齐");
  });
});

describe("CSV adapter", () => {
  it("detects language columns and saves edited cells", () => {
    const raw = fixture("translations.csv");
    const mapping = defaultCsvMapping(["key", "source", "en", "zh-CN", "ja"]);
    const document: SourceDocument = { id: "csv", path: "translations.csv", name: "translations.csv", raw, type: "csv", writable: true, csvMapping: mapping };
    const entries = parseCsv(document);
    entries[1].translations.ja = { value: "続ける", changed: true };
    expect(updateCsv(document, entries)).toContain("menu.continue,Continue,Continue,继续,続ける");
    entries[0] = { ...entries[0], source: "Begin Game", sourceChanged: true };
    expect(updateCsv(document, entries)).toContain("menu.start,Begin Game,Start Game,开始游戏,ゲーム開始");
  });
});

describe("Browser source saving", () => {
  function fileHandle(options: { permission?: PermissionState; verifyWrite?: boolean } = {}) {
    let content = "before";
    let modifiedAt = 1;
    const queryPermission = vi.fn(async () => options.permission ?? "prompt");
    const requestPermission = vi.fn(async () => options.permission ?? "granted");
    const handle = {
      queryPermission,
      requestPermission,
      getFile: vi.fn(async () => ({ lastModified: modifiedAt, text: async () => content })),
      createWritable: vi.fn(async () => ({
        write: async (next: string) => {
          if (options.verifyWrite !== false) content = next;
          modifiedAt += 1;
        },
        close: async () => undefined,
      })),
    } as unknown as FileSystemFileHandle;
    return { handle, queryPermission, requestPermission, content: () => content };
  }

  it("requests readwrite permission and verifies the persisted browser file", async () => {
    const file = fileHandle();
    const events: string[] = [];
    await expect(writeBrowserFile(file.handle, "after", 1, "GAME.po", (event) => events.push(event))).resolves.toBe(2);
    expect(file.queryPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(file.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(file.content()).toBe("after");
    expect(events).toEqual([
      "write.start",
      "write.preflight.start",
      "write.permission.queried",
      "write.permission.requested",
      "write.preflight.file",
      "write.preflight.success",
      "write.createWritable.start",
      "write.createWritable.success",
      "write.content.success",
      "write.close.success",
      "write.verify.readback",
    ]);
  });

  it("reports denied browser write permission instead of pretending to save", async () => {
    const file = fileHandle({ permission: "denied" });
    await expect(writeBrowserFile(file.handle, "after", 1, "GAME.po")).rejects.toThrow("Write permission was not granted for GAME.po");
    expect(file.content()).toBe("before");
  });

  it("reports a failed disk verification instead of clearing the changed state", async () => {
    const file = fileHandle({ permission: "granted", verifyWrite: false });
    await expect(writeBrowserFile(file.handle, "after", 1, "GAME.po")).rejects.toThrow("File write verification failed: GAME.po");
    expect(file.requestPermission).not.toHaveBeenCalled();
  });

  it("preflights browser file permission and external modifications before writing", async () => {
    const file = fileHandle();
    await expect(verifyBrowserFileWritable(file.handle, 1, "en/GAME.po")).resolves.toBeUndefined();
    expect(file.content()).toBe("before");
    await expect(verifyBrowserFileWritable(file.handle, 99, "en/GAME.po")).rejects.toThrow("File changed outside Lingrid: en/GAME.po");
    expect(file.content()).toBe("before");
  });
});

describe("Project state", () => {
  it("applies a focused cell draft before save or save-as serialization", () => {
    const entries = parsePo(po("zh-CN.po"));
    const drafted = applyTranslationDrafts(entries, ["zh-CN"], { [`${entries[0].key}\u0001zh-CN`]: "草稿译文" });
    expect(drafted[0].translations["zh-CN"]).toEqual({ value: "草稿译文", changed: true });
    expect(updatePo(po("zh-CN.po"), drafted)).toContain('msgstr "草稿译文"');
  });

  it("cycles translation sort modes and keeps empty values last for content sorting", () => {
    const entries = [
      { key: "b", source: "B", translations: { ja: { value: "Beta", changed: false } }, tags: [] },
      { key: "empty", source: "Empty", translations: { ja: { value: "", changed: false } }, tags: [] },
      { key: "a", source: "A", translations: { ja: { value: "Alpha", changed: false } }, tags: [] },
    ];
    expect(nextSortMode()).toBe("incomplete-first");
    expect(nextSortMode("incomplete-first")).toBe("complete-first");
    expect(nextSortMode("complete-first")).toBe("content-asc");
    expect(nextSortMode("content-asc")).toBe("content-desc");
    expect(nextSortMode("content-desc")).toBe("incomplete-first");
    expect(sortedEntries(entries, "ja", "incomplete-first").map((entry) => entry.key)).toEqual(["empty", "b", "a"]);
    expect(sortedEntries(entries, "ja", "content-asc").map((entry) => entry.key)).toEqual(["a", "b", "empty"]);
    expect(sortedEntries(entries, "ja", "content-desc").map((entry) => entry.key)).toEqual(["b", "a", "empty"]);
  });

  it("replaces multiline msgstr continuations instead of leaving stale translation text", () => {
    const raw = 'msgid ""\nmsgstr ""\n"Language: zh-CN\\n"\n\nmsgid "Greeting"\nmsgstr ""\n"Old "\n"value"\n';
    const document: SourceDocument = { id: "multiline", path: "multiline.po", name: "multiline.po", raw, type: "po", language: "zh-CN", writable: true };
    const entries = parsePo(document);
    entries[0].translations["zh-CN"] = { value: "New value", changed: true };
    const output = updatePo(document, entries);
    expect(output).toContain('msgstr "New value"');
    expect(output).not.toContain('"Old "');
    expect(output).not.toContain('"value"');
    expect(parsePo({ ...document, raw: output })[0].translations["zh-CN"].value).toBe("New value");
  });

  it("moves between editable translation cells with Enter and Tab semantics", () => {
    const rows = ["menu.start", "menu.continue"];
    const languages = ["zh-CN", "ja"];
    expect(adjacentCell(rows, languages, { key: "menu.start", language: "zh-CN" }, "next")).toEqual({ key: "menu.start", language: "ja" });
    expect(adjacentCell(rows, languages, { key: "menu.start", language: "ja" }, "next")).toEqual({ key: "menu.continue", language: "zh-CN" });
    expect(adjacentCell(rows, languages, { key: "menu.start", language: "ja" }, "down")).toEqual({ key: "menu.continue", language: "ja" });
    expect(adjacentCell(rows, languages, { key: "menu.start", language: "zh-CN" }, "previous")).toBeNull();
  });

  it("moves language columns left and right without mutating the existing order", () => {
    const order = ["zh-CN", "en", "ja"];
    expect(moveColumn(order, "ja", -1)).toEqual(["zh-CN", "ja", "en"]);
    expect(moveColumn(order, "zh-CN", 1)).toEqual(["en", "zh-CN", "ja"]);
    expect(moveColumn(order, "zh-CN", -1)).toBe(order);
  });

  it("reorders a dragged language column at the dropped language position", () => {
    const order = ["zh-CN", "en", "ja"];
    expect(reorderColumn(order, "ja", "zh-CN")).toEqual(["ja", "zh-CN", "en"]);
    expect(reorderColumn(order, "zh-CN", "ja")).toEqual(["en", "zh-CN", "ja"]);
    expect(reorderColumn(order, "zh-CN", "ja", "after")).toEqual(["en", "ja", "zh-CN"]);
    expect(reorderColumn(order, "en", "en")).toBe(order);
  });

  it("matches project files from either a narrow or broad authorized parent folder", () => {
    const stored = "C:\\Users\\ddonl\\gamedev\\localization\\game\\cn\\GAME.po";
    expect(pathsReferToSameFile(stored, "game/cn/GAME.po")).toBe(true);
    expect(pathsReferToSameFile(stored, "localization/game/cn/GAME.po")).toBe(true);
    expect(pathsReferToSameFile("localization/game/cn/GAME.po", "game/cn/GAME.po")).toBe(true);
    expect(pathsReferToSameFile(stored, "localization/game/jp/GAME.po")).toBe(false);
  });

  it("does not allow PO/POT and CSV files in the same project", () => {
    expect(canImportSourceTypes(["po"], ["pot"])).toBe(true);
    expect(canImportSourceTypes(["po"], ["csv"])).toBe(false);
    expect(canImportSourceTypes([], ["po", "csv"])).toBe(false);
  });

  it("stores file metadata and tags without translation bodies", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0].tags = ["#ui"];
    const output = serializeProject({ version: "0.1", documents: [document], entries, columnOrder: ["zh-CN"], columnLabels: { "zh-CN": "简体中文" }, columnWidths: { "zh-CN": 240 }, view: { search: "", completion: "all", completionLanguages: [], changedOnly: false, tags: [], wordTags: [], wordTagLanguages: [] } });
    expect(output).toContain('"#ui"');
    expect(output).toContain('"zh-CN": 240');
    expect(output).not.toContain("开始游戏");
    expect(output).not.toContain('"view"');
  });

  it("does not persist transient search, filter or force-fill view state", () => {
    const project = createProject();
    project.view = { search: "menu", completion: "incomplete", completionLanguages: ["zh-CN"], changedOnly: true, tags: ["#ui"], wordTags: ["#todo"], wordTagLanguages: ["zh-CN"], forceMissingCells: true, sort: { language: "zh-CN", mode: "content-asc" } };
    expect(JSON.parse(serializeProject(project))).not.toHaveProperty("view");
  });

  it("stores word tags per language cell in project JSON without writing them into PO", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0].translations["zh-CN"].tags = ["#review"];
    const project = createProject();
    project.documents = [document];
    project.entries = entries;
    const output = serializeProject(project);
    expect(output).toContain('"wordTags"');
    expect(output).toContain('"#review"');
    expect(updatePo(document, entries)).not.toContain("#review");
  });

  it("filters word tags within the selected language scope", () => {
    const entries = mergeEntries(parsePo(po("zh-CN.po")), parsePo(po("ja.po")));
    entries[0].translations["zh-CN"].tags = ["#review"];
    entries[1].translations.ja.tags = ["#review"];
    const project = createProject();
    project.entries = entries;
    project.columnOrder = ["zh-CN", "ja"];
    project.view.wordTags = ["#review"];
    project.view.wordTagLanguages = ["zh-CN"];
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Start Game"]);
    project.view.wordTagLanguages = ["ja"];
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Continue"]);
  });

  it("filters empty source tags and empty word tags", () => {
    const entries = mergeEntries(parsePo(po("zh-CN.po")), parsePo(po("ja.po")));
    entries[0].tags = ["#ui"];
    entries[0].translations["zh-CN"].tags = ["#review"];
    const project = createProject();
    project.entries = entries;
    project.columnOrder = ["zh-CN", "ja"];
    project.view.tags = [EMPTY_TAG_FILTER];
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Continue", "I used to be an adventurer like you, then I took an arrow in the knee."]);
    project.view.tags = [];
    project.view.wordTags = [EMPTY_TAG_FILTER];
    project.view.wordTagLanguages = ["zh-CN"];
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Continue", "I used to be an adventurer like you, then I took an arrow in the knee."]);
    project.view.wordTags = ["#review", EMPTY_TAG_FILTER];
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Start Game", "Continue", "I used to be an adventurer like you, then I took an arrow in the knee."]);
  });

  it("filters source, translations, tags and changed cells", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0].tags = ["#ui"];
    entries[0].translations["zh-CN"].changed = true;
    const project = { version: "0.1" as const, documents: [document], entries, columnOrder: ["zh-CN"], columnLabels: {}, columnWidths: {}, view: { search: "#ui", completion: "all" as const, completionLanguages: [], changedOnly: true, tags: ["#ui"], wordTags: [], wordTagLanguages: [] } };
    expect(filteredEntries(project)).toHaveLength(1);
    expect(projectStats(project)).toEqual({ total: 3, languages: { "zh-CN": { translated: 2, missing: 1, total: 3, completion: 67 } }, tags: { "#ui": 1 }, changed: 1 });
  });

  it("excludes matrix-only language gaps from completion statistics and filters until force-fill is enabled", () => {
    const entries = mergeEntries(
      parsePo(inlinePo("zh-CN", [{ source: "Shared", value: "共享" }, { source: "Missing translation", value: "" }])),
      parsePo(inlinePo("ja", [{ source: "Shared", value: "共有" }, { source: "Missing translation", value: "不足" }, { source: "Only in ja", value: "日本語のみ" }])),
    );
    const project: LingridProject = { version: "0.1", documents: [], entries, columnOrder: ["zh-CN", "ja"], columnLabels: {}, columnWidths: {}, view: { search: "", completion: "incomplete", completionLanguages: ["zh-CN"], changedOnly: false, tags: [], wordTags: [], wordTagLanguages: [] } };
    expect(projectStats(project).languages["zh-CN"].total).toBe(2);
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Missing translation"]);
    project.view.forceMissingCells = true;
    expect(projectStats(project).languages["zh-CN"].total).toBe(3);
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Missing translation", "Only in ja"]);
  });

  it("filters completion by selected languages and matches any selected tag", () => {
    const entries = mergeEntries(parsePo(po("zh-CN.po")), parsePo(po("ja.po")));
    entries[0].tags = ["#ui"];
    entries[1].tags = ["#review"];
    const project: LingridProject = { version: "0.1", documents: [], entries, columnOrder: ["zh-CN", "ja"], columnLabels: {}, columnWidths: {}, view: { search: "", completion: "incomplete", completionLanguages: ["ja"], editStatus: ["never-edited", "changed", "unchanged"], tags: ["#ui", "#review"], wordTags: [], wordTagLanguages: [] } };
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Continue"]);
    project.view.completionLanguages = ["zh-CN"];
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Continue"]);
    project.view.completion = "complete";
    expect(filteredEntries(project).map((entry) => entry.source)).toEqual(["Start Game"]);
  });

  it("migrates legacy single-tag project views", () => {
    expect(normalizeProjectView({ search: "", completion: "all", changedOnly: false, tag: "#ui" })).toEqual({
      search: "",
      completion: "all",
      completionLanguages: [],
      editStatus: ["never-edited", "changed", "unchanged"],
      tags: ["#ui"],
      wordTags: [],
      wordTagLanguages: [],
      forceMissingCells: false,
    });
  });
});
