import type { LingridProject, ProjectView, TranslationEntry } from "./types";

export const DEFAULT_VIEW: ProjectView = {
  search: "",
  completion: "all",
  changedOnly: false,
  tag: "",
};

export function createProject(): LingridProject {
  return {
    version: "0.1",
    documents: [],
    entries: [],
    columnOrder: [],
    columnLabels: {},
    view: { ...DEFAULT_VIEW },
  };
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
    const complete =
      project.columnOrder.length > 0 &&
      project.columnOrder.every((language) => entry.translations[language]?.value.trim());
    const changed = Object.values(entry.translations).some((cell) => cell.changed);
    const matchesQuery =
      !query ||
      entry.source.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      values.some((value) => value.toLowerCase().includes(query));

    return (
      matchesQuery &&
      (!project.view.tag || entry.tags.includes(project.view.tag)) &&
      (!project.view.changedOnly || changed) &&
      (project.view.completion === "all" ||
        (project.view.completion === "complete" && complete) ||
        (project.view.completion === "incomplete" && !complete))
    );
  });
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
