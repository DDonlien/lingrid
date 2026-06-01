import type { DocumentType, LingridProject, ProjectView, TranslationEntry, TranslationSortMode } from "./types";

export const DEFAULT_VIEW: ProjectView = {
  search: "",
  completion: "all",
  completionLanguages: [],
  changedOnly: false,
  tags: [],
};

export function normalizeProjectView(view?: Partial<ProjectView> & { tag?: string }): ProjectView {
  const { tag, ...current } = view ?? {};
  return {
    ...DEFAULT_VIEW,
    ...current,
    completionLanguages: view?.completionLanguages ?? [],
    tags: view?.tags ?? (tag ? [tag] : []),
  };
}

export function createProject(): LingridProject {
  return {
    version: "0.1",
    documents: [],
    entries: [],
    columnOrder: [],
    columnLabels: {},
    columnWidths: {},
    view: { ...DEFAULT_VIEW },
  };
}

export function canImportSourceTypes(existing: DocumentType[], incoming: DocumentType[]): boolean {
  const formats = new Set([...existing, ...incoming].map((type) => type === "csv" ? "csv" : "po"));
  return formats.size <= 1;
}

export function pathsReferToSameFile(storedPath: string, scannedPath: string): boolean {
  const normalize = (path: string) => path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "").toLowerCase();
  const stored = normalize(storedPath);
  const scanned = normalize(scannedPath);
  return Boolean(stored && scanned && (
    stored === scanned ||
    stored.endsWith(`/${scanned}`) ||
    scanned.endsWith(`/${stored}`)
  ));
}

export function moveColumn(columnOrder: string[], language: string, offset: -1 | 1): string[] {
  const index = columnOrder.indexOf(language);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= columnOrder.length) return columnOrder;
  const next = [...columnOrder];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function reorderColumn(columnOrder: string[], language: string, targetLanguage: string, placement: "before" | "after" = "before"): string[] {
  const index = columnOrder.indexOf(language);
  const target = columnOrder.indexOf(targetLanguage);
  if (index < 0 || target < 0 || index === target) return columnOrder;
  const next = [...columnOrder];
  const [column] = next.splice(index, 1);
  const adjustedTarget = target - (index < target ? 1 : 0);
  next.splice(adjustedTarget + (placement === "after" ? 1 : 0), 0, column);
  return next;
}

export function adjacentCell(
  entryKeys: string[],
  languages: string[],
  current: { key: string; language: string },
  direction: "next" | "previous" | "down",
): { key: string; language: string } | null {
  const row = entryKeys.indexOf(current.key);
  const column = languages.indexOf(current.language);
  if (row < 0 || column < 0 || !entryKeys.length || !languages.length) return null;
  if (direction === "down") {
    return row + 1 < entryKeys.length ? { key: entryKeys[row + 1], language: current.language } : null;
  }
  const index = row * languages.length + column + (direction === "next" ? 1 : -1);
  if (index < 0 || index >= entryKeys.length * languages.length) return null;
  return { key: entryKeys[Math.floor(index / languages.length)], language: languages[index % languages.length] };
}

export function mergeEntries(
  existing: TranslationEntry[],
  incoming: TranslationEntry[],
): TranslationEntry[] {
  const entries = new Map(existing.map((entry) => [entry.key, entry]));
  for (const next of incoming) {
    const current = entries.get(next.key);
    if (!current) {
      entries.set(next.key, next);
      continue;
    }
    current.translations = { ...current.translations, ...next.translations };
    current.context ||= next.context;
    current.plural ||= next.plural;
  }
  return [...entries.values()];
}

export function normalizeTag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function filteredEntries(project: LingridProject): TranslationEntry[] {
  const query = project.view.search.trim().toLowerCase();
  return project.entries.filter((entry) => {
    const values = Object.values(entry.translations).map((cell) => cell.value);
    const completionLanguages = project.view.completionLanguages.length
      ? project.view.completionLanguages
      : project.columnOrder;
    const complete = completionLanguages.length > 0 &&
      completionLanguages.every((language) => entry.translations[language]?.value.trim());
    const changed = Object.values(entry.translations).some((cell) => cell.changed);
    const matchesQuery =
      !query ||
      entry.source.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      values.some((value) => value.toLowerCase().includes(query));

    return (
      matchesQuery &&
      (!project.view.tags.length || project.view.tags.some((tag) => entry.tags.includes(tag))) &&
      (!project.view.changedOnly || changed) &&
      (project.view.completion === "all" ||
        (project.view.completion === "complete" && complete) ||
        (project.view.completion === "incomplete" && !complete))
    );
  });
}

export function sortedEntries(entries: TranslationEntry[], language: string, mode: TranslationSortMode): TranslationEntry[] {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  return entries.map((entry, index) => ({ entry, index })).sort((left, right) => {
    const leftValue = left.entry.translations[language]?.value.trim() ?? "";
    const rightValue = right.entry.translations[language]?.value.trim() ?? "";
    const leftEmpty = !leftValue;
    const rightEmpty = !rightValue;
    if (leftEmpty !== rightEmpty) {
      if (mode === "incomplete-first") return leftEmpty ? -1 : 1;
      return leftEmpty ? 1 : -1;
    }
    if (leftEmpty && rightEmpty) return left.index - right.index;
    if (mode === "content-asc" || mode === "content-desc") {
      const result = collator.compare(leftValue, rightValue);
      if (result) return mode === "content-asc" ? result : -result;
    }
    return left.index - right.index;
  }).map(({ entry }) => entry);
}

export function nextSortMode(mode?: TranslationSortMode): TranslationSortMode {
  if (!mode) return "incomplete-first";
  if (mode === "incomplete-first") return "complete-first";
  if (mode === "complete-first") return "content-asc";
  if (mode === "content-asc") return "content-desc";
  return "incomplete-first";
}

export function serializeProject(project: LingridProject): string {
  const tags = Object.fromEntries(
    project.entries.filter((entry) => entry.tags.length).map((entry) => [entry.key, entry.tags]),
  );
  return JSON.stringify(
    {
      version: project.version,
      files: project.documents.map(({ id, path, name, type, language, writable, csvMapping }) => ({
        id,
        path,
        name,
        type,
        language,
        writable,
        csvMapping,
      })),
      columnOrder: project.columnOrder,
      columnLabels: project.columnLabels,
      columnWidths: project.columnWidths,
      tags,
      view: project.view,
    },
    null,
    2,
  );
}

export function projectStats(project: LingridProject) {
  const languages = Object.fromEntries(
    project.columnOrder.map((language) => {
      const translated = project.entries.filter((entry) => entry.translations[language]?.value.trim()).length;
      return [language, { translated, missing: project.entries.length - translated, completion: project.entries.length ? Math.round((translated / project.entries.length) * 100) : 0 }];
    }),
  );
  const tags: Record<string, number> = {};
  let changed = 0;
  for (const entry of project.entries) {
    entry.tags.forEach((tag) => { tags[tag] = (tags[tag] ?? 0) + 1; });
    changed += (entry.sourceChanged ? 1 : 0) + Object.values(entry.translations).filter((cell) => cell.changed).length;
  }
  return { total: project.entries.length, languages, tags, changed };
}
