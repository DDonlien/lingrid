import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultCsvMapping, parseCsv, updateCsv } from "../src/adapters/csv";
import { detectPoLanguage, parsePo, updatePo } from "../src/adapters/po";
import { filteredEntries, mergeEntries, projectStats, serializeProject } from "../src/core/project";
import type { SourceDocument } from "../src/core/types";

function fixture(name: string): string {
  return readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

function po(name: string): SourceDocument {
  const raw = fixture(name);
  return { id: name, path: name, name, raw, type: "po", language: detectPoLanguage(raw, name), writable: true };
}

describe("PO adapter", () => {
  it("merges language documents using context and source", () => {
    const zh = parsePo(po("zh-CN.po"));
    const ja = parsePo(po("ja.po"));
    const merged = mergeEntries(zh, ja);
    expect(merged).toHaveLength(2);
    expect(merged[0].translations["zh-CN"].value).toBe("开始游戏");
    expect(merged[0].translations.ja.value).toBe("ゲーム開始");
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

describe("Project state", () => {
  it("stores file metadata and tags without translation bodies", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0].tags = ["#ui"];
    const output = serializeProject({ version: "0.1", documents: [document], entries, columnOrder: ["zh-CN"], columnLabels: { "zh-CN": "简体中文" }, view: { search: "", completion: "all", changedOnly: false, tag: "" } });
    expect(output).toContain('"#ui"');
    expect(output).not.toContain("开始游戏");
  });

  it("filters source, translations, tags and changed cells", () => {
    const document = po("zh-CN.po");
    const entries = parsePo(document);
    entries[0].tags = ["#ui"];
    entries[0].translations["zh-CN"].changed = true;
    const project = { version: "0.1" as const, documents: [document], entries, columnOrder: ["zh-CN"], columnLabels: {}, view: { search: "#ui", completion: "all" as const, changedOnly: true, tag: "#ui" } };
    expect(filteredEntries(project)).toHaveLength(1);
    expect(projectStats(project)).toEqual({ total: 2, languages: { "zh-CN": { translated: 1, missing: 1, completion: 50 } }, tags: { "#ui": 1 }, changed: 1 });
  });
});
