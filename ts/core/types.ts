export type DocumentType = "po" | "pot" | "csv";

export interface TranslationCell {
  value: string;
  changed: boolean;
  tags?: string[];
  neverEdited?: boolean;
}

export interface TranslationEntry {
  key: string;
  source: string;
  sourceChanged?: boolean;
  context?: string;
  plural?: string;
  poTemplateRaw?: string;
  translations: Record<string, TranslationCell>;
  tags: string[];
}

export interface CsvMapping {
  sourceColumn: string;
  languageColumns: Record<string, string>;
  keyColumn?: string;
}

export interface SourceDocument {
  id: string;
  path: string;
  name: string;
  type: DocumentType;
  fileHandle?: FileSystemFileHandle;
  language?: string;
  raw: string;
  writable: boolean;
  modifiedAt?: number;
  csvMapping?: CsvMapping;
}

export interface ProjectView {
  search: string;
  completion: "all" | "complete" | "incomplete";
  completionLanguages: string[];
  editStatus: string[];
  tags: string[];
  wordTags: string[];
  wordTagLanguages: string[];
  forceMissingCells?: boolean;
  sort?: {
    language: string;
    mode: TranslationSortMode;
  };
}

export type TranslationSortMode = "incomplete-first" | "complete-first" | "content-asc" | "content-desc";

export interface LingridProject {
  version: "0.1";
  documents: SourceDocument[];
  entries: TranslationEntry[];
  columnOrder: string[];
  columnLabels: Record<string, string>;
  columnWidths: Record<string, number>;
  view: ProjectView;
  projectPath?: string;
  projectFileHandle?: FileSystemFileHandle;
  directoryHandle?: FileSystemDirectoryHandle;
}

export interface RecentProject {
  path: string;
  name: string;
  lastAccessed: number;
  sourceCount: number;
  languages: string[];
}

export type AiProvider = "openai-compatible" | "anthropic-compatible" | "deepl";

export interface AiSettingsProfile {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  prompt?: string;
}

export interface AiSettings {
  provider: AiProvider;
  openAiPreset: string;
  anthropicPreset: string;
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  deeplRegion: "deepl" | "deeplx";
  profiles?: Record<string, AiSettingsProfile>;
}
