export type DocumentType = "po" | "pot" | "csv";

export interface TranslationCell {
  value: string;
  changed: boolean;
}

export interface TranslationEntry {
  key: string;
  source: string;
  sourceChanged?: boolean;
  context?: string;
  plural?: string;
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
  language?: string;
  raw: string;
  writable: boolean;
  modifiedAt?: number;
  csvMapping?: CsvMapping;
}

export interface ProjectView {
  search: string;
  completion: "all" | "complete" | "incomplete";
  changedOnly: boolean;
  tag: string;
}

export interface LingridProject {
  version: "0.1";
  documents: SourceDocument[];
  entries: TranslationEntry[];
  columnOrder: string[];
  columnLabels: Record<string, string>;
  view: ProjectView;
  projectPath?: string;
}

export interface AiSettings {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
}
