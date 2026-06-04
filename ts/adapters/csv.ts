import type { CsvMapping, SourceDocument, TranslationEntry } from "../core/types";

export function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === '"' && quoted && raw[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && raw[i + 1] === "\n") i += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function defaultCsvMapping(headers: string[]): CsvMapping {
  const sourceColumn = headers.find((header) => /^(source|msgid|text)$/i.test(header)) ?? headers[0];
  const keyColumn = headers.find((header) => /^(id|key)$/i.test(header));
  const ignored = new Set([sourceColumn, keyColumn, "tag", "tags", "note"].filter(Boolean));
  return {
    sourceColumn,
    keyColumn,
    languageColumns: Object.fromEntries(headers.filter((header) => !ignored.has(header)).map((header) => [header, header])),
  };
}

export function parseCsv(document: SourceDocument): TranslationEntry[] {
  const [headers, ...rows] = parseCsvRows(document.raw);
  if (!headers?.length) return [];
  const mapping = document.csvMapping ?? defaultCsvMapping(headers);
  const sourceIndex = headers.indexOf(mapping.sourceColumn);
  const keyIndex = mapping.keyColumn ? headers.indexOf(mapping.keyColumn) : -1;
  return rows.map((row) => {
    const source = row[sourceIndex] ?? "";
    const csvKey = keyIndex >= 0 ? row[keyIndex] : source;
    return {
      key: `csv\u0000${csvKey}`,
      source,
      translations: Object.fromEntries(
        Object.entries(mapping.languageColumns).map(([language, column]) => [
          language,
          { value: row[headers.indexOf(column)] ?? "", changed: false },
        ]),
      ),
      tags: [],
    };
  });
}

export function updateCsv(document: SourceDocument, entries: TranslationEntry[]): string {
  const [headers, ...rows] = parseCsvRows(document.raw);
  const mapping = document.csvMapping ?? defaultCsvMapping(headers);
  const sourceIndex = headers.indexOf(mapping.sourceColumn);
  const keyIndex = mapping.keyColumn ? headers.indexOf(mapping.keyColumn) : -1;
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const output = rows.map((row) => {
    const key = `csv\u0000${keyIndex >= 0 ? row[keyIndex] : row[sourceIndex]}`;
    const entry = byKey.get(key);
    if (!entry) return row;
    if (entry.sourceChanged) row[sourceIndex] = entry.source;
    for (const [language, column] of Object.entries(mapping.languageColumns)) {
      const cell = entry.translations[language];
      if (cell?.changed) row[headers.indexOf(column)] = cell.value;
    }
    return row;
  });
  return [headers, ...output].map((row) => row.map(escapeCsv).join(",")).join("\n");
}
