import type { DocumentType, LingridProject, ProjectView, RecentProject, TranslationEntry, TranslationSortMode } from "./types";

export const DEFAULT_VIEW: ProjectView = {
  search: "",
  completion: "all",
  completionLanguages: [],
  editStatus: ["never-edited", "changed", "unchanged"],
  tags: [],
  wordTags: [],
  wordTagLanguages: [],
  forceMissingCells: false,
};
export const EMPTY_TAG_FILTER = "\u0000empty";
export const EDIT_STATUS_NEVER_EDITED = "never-edited";
export const EDIT_STATUS_CHANGED = "changed";
export const EDIT_STATUS_UNCHANGED = "unchanged";
export const EDIT_STATUS_OPTIONS = [EDIT_STATUS_NEVER_EDITED, EDIT_STATUS_CHANGED, EDIT_STATUS_UNCHANGED];
export const RECENT_PROJECTS_KEY = "lingrid-recent-projects";
export const MAX_RECENT_PROJECTS = 10;

export function normalizeProjectView(view?: Partial<ProjectView> & { tag?: string; changedOnly?: boolean }): ProjectView {
  const { tag, changedOnly, ...current } = view ?? {};
  const editStatus = view?.editStatus ?? (changedOnly ? [EDIT_STATUS_CHANGED] : EDIT_STATUS_OPTIONS);
  return {
    ...DEFAULT_VIEW,
    ...current,
    completionLanguages: view?.completionLanguages ?? [],
    editStatus,
    tags: view?.tags ?? (tag ? [tag] : []),
    wordTags: view?.wordTags ?? [],
    wordTagLanguages: view?.wordTagLanguages ?? [],
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

export function applyTranslationDrafts(
  entries: TranslationEntry[],
  columnOrder: string[],
  drafts: Record<string, string>,
): TranslationEntry[] {
  return entries.map((entry) => ({
    ...entry,
    translations: Object.fromEntries(columnOrder.flatMap((language) => {
      const key = `${entry.key}\u0001${language}`;
      const cell = entry.translations[language];
      if (!cell && !(key in drafts)) return [];
      const value = key in drafts ? drafts[key] : cell.value;
      return [[language, { ...cell, value, changed: cell?.changed || value !== (cell?.value ?? "") }]];
    })),
  }));
}

export function cellParticipates(entry: TranslationEntry, language: string, forceMissingCells = false): boolean {
  return forceMissingCells || Boolean(entry.translations[language]);
}

export function filteredEntries(project: LingridProject): TranslationEntry[] {
  const query = project.view.search.trim().toLowerCase();
  const editStatus = project.view.editStatus?.length ? project.view.editStatus : EDIT_STATUS_OPTIONS;
  return project.entries.filter((entry) => {
    const values = Object.values(entry.translations).map((cell) => cell.value);
    const wordTagLanguages = project.view.wordTagLanguages.length ? project.view.wordTagLanguages : project.columnOrder;
    const completionLanguages = project.view.completionLanguages.length
      ? project.view.completionLanguages
      : project.columnOrder;
    const participatingLanguages = completionLanguages.filter((language) => cellParticipates(entry, language, project.view.forceMissingCells));
    const complete = participatingLanguages.length > 0 &&
      participatingLanguages.every((language) => entry.translations[language]?.value.trim());
    const matchesQuery =
      !query ||
      entry.source.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      Object.values(entry.translations).some((cell) => cell.tags?.some((tag) => tag.toLowerCase().includes(query))) ||
      values.some((value) => value.toLowerCase().includes(query));
    const matchesWordTags = !project.view.wordTags.length || wordTagLanguages.some((language) => {
      const cell = entry.translations[language];
      if (!cell) return false;
      const tags = cell.tags ?? [];
      return (
        tags.some((tag) => project.view.wordTags.includes(tag)) ||
        (project.view.wordTags.includes(EMPTY_TAG_FILTER) && tags.length === 0)
      );
    });
    const matchesEditStatus = editStatus.length === EDIT_STATUS_OPTIONS.length || Object.values(entry.translations).some((cell) => {
      if (editStatus.includes(EDIT_STATUS_CHANGED) && cell.changed) return true;
      if (editStatus.includes(EDIT_STATUS_NEVER_EDITED) && cell.neverEdited) return true;
      if (editStatus.includes(EDIT_STATUS_UNCHANGED) && !cell.changed && !cell.neverEdited && cell.value !== undefined) return true;
      return false;
    });

    return (
      matchesQuery &&
      (!project.view.tags.length ||
        project.view.tags.some((tag) => entry.tags.includes(tag)) ||
        (project.view.tags.includes(EMPTY_TAG_FILTER) && entry.tags.length === 0)) &&
      matchesWordTags &&
      matchesEditStatus &&
      (project.view.completion === "all" ||
        (participatingLanguages.length === 0 ? false :
        (project.view.completion === "complete" && complete) ||
        (project.view.completion === "incomplete" && !complete)))
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
  const wordTags = Object.fromEntries(project.entries.flatMap((entry) => {
    const cells = Object.fromEntries(Object.entries(entry.translations)
      .filter(([, cell]) => cell.tags?.length)
      .map(([language, cell]) => [language, cell.tags]));
    return Object.keys(cells).length ? [[entry.key, cells]] : [];
  }));
  const neverEdited = Object.fromEntries(project.entries.flatMap((entry) => {
    const cells = Object.fromEntries(Object.entries(entry.translations)
      .filter(([, cell]) => cell.neverEdited)
      .map(([language]) => [language, true]));
    return Object.keys(cells).length ? [[entry.key, cells]] : [];
  }));
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
      wordTags,
      neverEdited,
    },
    null,
    2,
  );
}

export function projectStats(project: LingridProject) {
  const languages = Object.fromEntries(
    project.columnOrder.map((language) => {
      const participating = project.entries.filter((entry) => cellParticipates(entry, language, project.view.forceMissingCells));
      const translated = participating.filter((entry) => entry.translations[language]?.value.trim()).length;
      return [language, { translated, missing: participating.length - translated, total: participating.length, completion: participating.length ? Math.round((translated / participating.length) * 100) : 0 }];
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

export function loadRecentProjects(storage: StorageLike = window.localStorage): RecentProject[] {
  try {
    const raw = storage.getItem(RECENT_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.path === "string" && typeof item.name === "string");
  } catch {
    return [];
  }
}

export function saveRecentProjects(projects: RecentProject[], storage: StorageLike = window.localStorage): void {
  try {
    storage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // localStorage may be full or disabled. Silently skip.
  }
}

export function addRecentProject(
  projects: RecentProject[],
  project: LingridProject,
  path?: string,
): RecentProject[] {
  const projectPath = path ?? project.projectPath ?? "";
  if (!projectPath) return projects;
  const name = projectPath.split(/[\\/]/).filter(Boolean).pop() ?? projectPath;
  const next: RecentProject = {
    path: projectPath,
    name,
    lastAccessed: Date.now(),
    sourceCount: project.documents.length,
    languages: [...project.columnOrder],
  };
  const filtered = projects.filter((item) => item.path !== projectPath);
  return [next, ...filtered].slice(0, MAX_RECENT_PROJECTS);
}

export function removeRecentProject(projects: RecentProject[], path: string): RecentProject[] {
  return projects.filter((item) => item.path !== path);
}

export function clearRecentProjects(storage: StorageLike = window.localStorage): void {
  try {
    storage.removeItem(RECENT_PROJECTS_KEY);
  } catch {
    // Silently skip.
  }
}
