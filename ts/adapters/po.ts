import type { SourceDocument, TranslationEntry } from "../core/types";

interface PoBlock {
  raw: string;
  context?: string;
  source?: string;
  plural?: string;
  translations: string[];
}

const quotedValue = /"(.*)"$/;

function decodeQuoted(value: string): string {
  try {
    return JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
      .replace(/\\\\n/g, "\n")
      .replace(/\\\\r/g, "\r")
      .replace(/\\\\t/g, "\t")
      .replace(/\\\\"/g, '"')
      .replace(/\\\\\\\\/g, "\\");
  } catch {
    return value;
  }
}

function encodeQuoted(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

function replaceField(raw: string, field: string, value: string): string {
  const encoded = encodeQuoted(value);
  const pattern = new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+".*"(?:\\r?\\n".*")*`, "m");
  return pattern.test(raw) ? raw.replace(pattern, `${field} "${encoded}"`) : `${raw}\n${field} "${encoded}"`;
}

function replaceTranslationFields(raw: string, value: string): string {
  let wrotePrimary = false;
  const output = raw.replace(/^msgstr(?:\[(\d+)\])?\s+".*"(?:\r?\n".*")*/gm, (match, index: string | undefined) => {
    const primary = index === undefined || index === "0";
    if (primary) wrotePrimary = true;
    const field = index === undefined ? "msgstr" : `msgstr[${index}]`;
    return `${field} "${primary ? encodeQuoted(value) : ""}"`;
  });
  return wrotePrimary ? output : `${output}\nmsgstr "${encodeQuoted(value)}"`;
}

function fieldValue(lines: string[], field: string): string | undefined {
  const index = lines.findIndex((line) => line.startsWith(`${field} `));
  if (index < 0) return undefined;
  const first = lines[index].match(quotedValue)?.[1] ?? "";
  let value = decodeQuoted(first);
  for (let i = index + 1; i < lines.length && lines[i].startsWith('"'); i += 1) {
    value += decodeQuoted(lines[i].slice(1, -1));
  }
  return value;
}

function parseBlock(raw: string): PoBlock {
  const lines = raw.split(/\r?\n/);
  const translations: string[] = [];
  for (let index = 0; index < 20; index += 1) {
    const field = index === 0 ? "msgstr" : `msgstr[${index}]`;
    const value = fieldValue(lines, field);
    if (value === undefined) {
      if (index > 0) break;
      continue;
    }
    translations[index] = value;
  }
  return {
    raw,
    context: fieldValue(lines, "msgctxt"),
    source: fieldValue(lines, "msgid"),
    plural: fieldValue(lines, "msgid_plural"),
    translations,
  };
}

function blocks(raw: string): PoBlock[] {
  return raw.split(/\r?\n\r?\n/).map(parseBlock);
}

function stableKey(context = "", source = "", plural = ""): string {
  return `${context}\u0000${source}\u0000${plural}`;
}

export function detectPoLanguage(raw: string, fallback: string): string {
  const match = raw.match(/^"?Language:\s*([^\\\r\n"]+)/im);
  return match?.[1]?.trim() || fallback.replace(/\.(po|pot)$/i, "");
}

export function parsePo(document: SourceDocument): TranslationEntry[] {
  const language = document.language ?? detectPoLanguage(document.raw, document.name);
  return blocks(document.raw)
    .filter((block) => block.source)
    .map((block) => ({
      key: stableKey(block.context, block.source, block.plural),
      source: block.source ?? "",
      context: block.context,
      plural: block.plural,
      poTemplateRaw: block.raw,
      translations:
        document.type === "pot"
          ? {}
          : { [language]: { value: block.translations[0] ?? "", changed: false } },
      tags: [],
    }));
}

export function updatePo(
  document: SourceDocument,
  entries: TranslationEntry[],
): string {
  if (!document.language || !document.writable) return document.raw;
  const language = document.language;
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const originalKeys = new Set<string>();
  const output = blocks(document.raw)
    .map((block) => {
      if (!block.source) return block.raw;
      const key = stableKey(block.context, block.source, block.plural);
      originalKeys.add(key);
      const entry = byKey.get(key);
      const cell = entry?.translations[language];
      if (!cell?.changed && !entry?.sourceChanged) return block.raw;
      let output = block.raw;
      if (entry?.sourceChanged) {
        output = replaceField(output, "msgid", entry.source);
      }
      if (!cell?.changed) return output;
      return replaceField(output, "msgstr", cell.value);
    })
    .join("\n\n");
  const additions = entries.flatMap((entry) => {
    const cell = entry.translations[language];
    if (!cell?.changed || originalKeys.has(entry.key)) return [];
    const raw = entry.poTemplateRaw ??
      [entry.context ? `msgctxt "${encodeQuoted(entry.context)}"` : "", `msgid "${encodeQuoted(entry.source)}"`, entry.plural ? `msgid_plural "${encodeQuoted(entry.plural)}"` : "", 'msgstr ""']
        .filter(Boolean)
        .join("\n");
    return [replaceTranslationFields(raw, cell.value)];
  });
  return additions.length ? `${output}\n\n${additions.join("\n\n")}` : output;
}
