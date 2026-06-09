import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Bot,
  Check,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  Hash,
  History,
  Languages,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ArrowDownAZ,
  ArrowUpAZ,
  CircleCheck,
  CircleDashed,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { defaultCsvMapping, parseCsv, parseCsvRows, updateCsv } from "../adapters/csv";
import { detectPoLanguage, parsePo, updatePo } from "../adapters/po";
import { rateLimitRetryDelayMs, renderAiPromptTemplate, runAdaptiveConcurrentBatch } from "../core/ai";
import { writeBrowserFile } from "../core/browser-files";
import { adjacentCell, addRecentProject, applyTranslationDrafts, canImportSourceTypes, cellParticipates, clearRecentProjects, createProject, EMPTY_TAG_FILTER, filteredEntries, loadRecentProjects, mergeEntries, nextSortMode, normalizeProjectView, normalizeTag, pathsReferToSameFile, projectStats, removeRecentProject, reorderColumn, saveRecentProjects, serializeProject, sortedEntries } from "../core/project";
import type { AiProvider, AiSettings, AiSettingsProfile, LingridProject, RecentProject, SourceDocument, TranslationEntry, TranslationSortMode } from "../core/types";
import { DEEPL_ENDPOINTS, ProviderHttpError as DeepLProviderHttpError, requestDeepLTranslation, toDeepLTargetLanguage } from "./providers/deepl";
import { ProviderHttpError as OpenAiProviderHttpError, requestOpenAiCompatibleTranslation } from "./providers/openai-compatible";
import { ANTHROPIC_COMPATIBLE_PRESETS, OPENAI_COMPATIBLE_PRESETS, providerPreset } from "./providers/presets";
import { createDemoProject, type DemoSourceLanguage } from "./demo";

type Modal = "ai" | "batch" | "files" | "csv" | "diagnostics" | null;
type Selection = { key: string; language: string } | null;
type MatrixCellSelection = { key: string; column: string };
type EntriesSnapshot = TranslationEntry[];
type UiLanguage = "zh" | "ja" | "en";
type ProjectConfig = {
  files?: Array<Pick<SourceDocument, "path" | "name" | "type" | "language" | "csvMapping">>;
  columnOrder?: string[];
  columnLabels?: Record<string, string>;
  columnWidths?: Record<string, number>;
  tags?: Record<string, string[]>;
  wordTags?: Record<string, Record<string, string[]>>;
  neverEdited?: Record<string, Record<string, boolean>>;
  view?: Partial<LingridProject["view"]> & { tag?: string; changedOnly?: boolean };
};
type BrowserSourceFile = { name: string; path: string; content: string; modifiedAt?: number; fileHandle?: FileSystemFileHandle };
type SourceSaveStatus = { kind: "idle" } | { kind: "success"; changedCount: number } | { kind: "download"; fileCount: number } | { kind: "error"; message: string };
const cellDraftKey = (entryKey: string, language: string) => `${entryKey}\u0001${language}`;
const matrixCellKey = (entryKey: string, column: string) => `${entryKey}\u0001${column}`;
const SOURCE_COLUMN = "$source";
const TAGS_COLUMN = "$tags";
const DEFAULT_COLUMN_WIDTHS = { [SOURCE_COLUMN]: 210, [TAGS_COLUMN]: 110 };
const DEFAULT_LANGUAGE_WIDTH = 115;
const MIN_COLUMN_WIDTH = 96;
const MAX_COLUMN_WIDTH = 640;
const MAX_HISTORY_STEPS = 100;
const UI_LANGUAGE_KEY = "lingrid-ui-language";
const AI_SETTINGS_KEY = "lingrid-ai-settings";
const DEFAULT_OPENAI_PRESET = "openai";
const DEFAULT_ANTHROPIC_PRESET = "claude-native";
const LEGACY_DEFAULT_AI_PROMPT = "Translate the following source text into {{language}}. Return only the translation:\n\n{{source}}";
const DEFAULT_AI_PROMPT = "Translate the following source text into {{language}} for a game localization context.\n\nInterpret the source text according to its original in-game meaning and the common terminology used in the source language's game industry. Then translate it into natural, player-facing {{language}} that follows the conventions, wording, and habits of the game industry and players in the target region.\n\nPrioritize referring to the source text, and also refer to the existing translations in other languages for the same entry ({{OtherLan}}: {{OhterContent}}) before giving the {{language}} translation.\n\nReturn only the final translation. Do not add explanations, notes, quotation marks, or alternatives.\n\nSource text:\n{{source}}";
const UI_LANGUAGES: Array<{ value: UiLanguage; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];
const UI_TEXT = {
  zh: {
    open: "打开", importCsv: "导入 CSV", openProject: "打开项目", authorizeFolder: "授权项目文件夹", csvMapping: "CSV 映射",
    save: "保存", saveAs: "另存为", saveProject: "保存项目", saveProjectAs: "项目另存为", batchReplace: "批量替换", aiSettings: "AI 设置",
    search: "搜索 source、译文或 #tag", allEntries: "全部条目", complete: "已完成", incomplete: "未完成", languages: "语言", allLanguages: "全部语言",
    changedOnly: "仅显示已修改", editStatus: "修改状态", neverEdited: "从未修改", changed: "已修改", unchanged: "未修改", allTags: "全部", emptyTag: "空", source: "Source", tags: "Tags", sourceTags: "Source Tag", wordTags: "Word Tag", allWordTags: "全部", missingTranslation: "缺少译文",
    detailEditor: "详情编辑器", noSelection: "未选择", keyContext: "Key / context", translation: "译文", enterTranslation: "输入译文…",
    aiSuggestion: "AI 建议", generate: "生成", applySuggestion: "应用建议", aiEmpty: "为当前单元格生成建议。已有译文不会被自动覆盖。",
    aiEmptyBatch: "将翻译所有空置的译文单元格。已有译文不会被自动覆盖。",
    selectCell: "选择一个译文单元格进行编辑。", completion: "完成度", renameColumns: "重命名列", translated: "已翻译",
    allSaved: "所有更改已保存", notSaved: "未保存", projectNotSaved: "项目未保存", sourceFiles: "个源文件", saveFailed: "保存失败", savedAndVerified: "已写入并校验", changedCells: "个已修改单元格", downloadedCopy: "浏览器无法直接覆盖原文件，已下载更新副本",
    aiSuggestionSettings: "AI 建议设置", provider: "提供商", providerOpenAi: "OpenAI 兼容", providerOtherCompatible: "其他兼容", providerDeepl: "DeepL", providerHelp: "选择用于当前单元格建议的翻译服务。已有译文不会被自动覆盖。", openAiHelp: "适合 OpenAI 兼容的 Chat Completions API。", otherCompatibleHelp: "预留 Anthropic-compatible 等非 OpenAI 路径。", deeplHelp: "适合 DeepL 官方翻译接口。", providerPreset: "服务预设", disabledProvider: "待实现", deeplRegion: "DeepL 服务", deeplFree: "DeepL", deeplPro: "DeepLX", deeplRegionHelp: "选择官方 DeepL 或自托管 DeepLX；接口地址可手动调整。", credentials: "连接信息", apiEndpoint: "API 地址", model: "模型", apiKey: "API 密钥", promptTemplate: "提示词模板", promptHelp: "可使用 {{language}} 和 {{source}} 占位符。", done: "完成",
    find: "查找", replaceWith: "替换为", scope: "范围", currentLanguage: "当前语言", applyReplacement: "应用替换", matchesFound: "处匹配",
    renameLanguageColumns: "重命名语言列", csvColumnMapping: "CSV 列映射", sourceColumn: "Source 列", optionalKeyColumn: "可选 id/key 列",
    languageColumns: "语言列，使用逗号分隔", applyMapping: "应用映射", uiLanguage: "界面语言",
    diagnostics: "诊断日志", copyDiagnostics: "复制日志", clearDiagnostics: "清空日志", diagnosticsCopied: "诊断日志已复制",
    forceMissingCells: "强制补齐", unavailableCell: "源文件中不存在此条目",
    recentProjects: "最近项目", clearRecentProjects: "清除历史", noRecentProjects: "暂无最近项目", openRecentProject: "打开最近项目",
  },
  ja: {
    open: "開く", importCsv: "CSV を読み込む", openProject: "プロジェクトを開く", authorizeFolder: "フォルダーを許可", csvMapping: "CSV マッピング",
    save: "保存", saveAs: "名前を付けて保存", saveProject: "プロジェクトを保存", saveProjectAs: "プロジェクトを別名保存", batchReplace: "一括置換", aiSettings: "AI 設定",
    search: "source、翻訳、#tag を検索", allEntries: "すべて", complete: "完了", incomplete: "未完了", languages: "言語", allLanguages: "すべての言語",
    changedOnly: "変更のみ", allTags: "すべて", emptyTag: "空", source: "Source", tags: "Tags", sourceTags: "Source Tag", wordTags: "Word Tag", allWordTags: "すべて", missingTranslation: "翻訳なし",
    detailEditor: "詳細エディター", noSelection: "未選択", keyContext: "Key / context", translation: "翻訳", enterTranslation: "翻訳を入力…",
    aiSuggestion: "AI 提案", generate: "生成", applySuggestion: "提案を適用", aiEmpty: "選択セルの提案を生成します。既存の翻訳は自動上書きされません。",
    aiEmptyBatch: "空の翻訳セルをすべて翻訳します。既存の翻訳は自動上書きされません。",
    selectCell: "翻訳セルを選択してください。", completion: "進捗", renameColumns: "列名を変更", translated: "翻訳済み",
    allSaved: "すべて保存済み", notSaved: "未保存", projectNotSaved: "プロジェクト未保存", sourceFiles: "個のソースファイル", saveFailed: "保存に失敗", savedAndVerified: "書き込みと検証が完了", changedCells: "件の変更セル", downloadedCopy: "ブラウザーから元ファイルを上書きできないため、更新済みコピーをダウンロードしました",
    aiSuggestionSettings: "AI 提案設定", provider: "プロバイダー", providerOpenAi: "OpenAI 互換", providerOtherCompatible: "その他互換", providerDeepl: "DeepL", providerHelp: "現在のセルへの提案に使う翻訳サービスを選びます。既存の翻訳は自動上書きされません。", openAiHelp: "OpenAI 互換の Chat Completions API 向け。", otherCompatibleHelp: "Anthropic-compatible など非 OpenAI 経路の予約枠です。", deeplHelp: "DeepL 公式翻訳 API 向け。", providerPreset: "サービスプリセット", disabledProvider: "未実装", deeplRegion: "DeepL サービス", deeplFree: "DeepL", deeplPro: "DeepLX", deeplRegionHelp: "公式 DeepL またはセルフホスト DeepLX を選びます。endpoint は手動調整できます。", credentials: "接続情報", apiEndpoint: "API エンドポイント", model: "モデル", apiKey: "API キー", promptTemplate: "プロンプト", promptHelp: "{{language}} と {{source}} のプレースホルダーが使えます。", done: "完了",
    find: "検索", replaceWith: "置換後", scope: "範囲", currentLanguage: "現在の言語", applyReplacement: "置換を適用", matchesFound: "件一致",
    renameLanguageColumns: "言語列名を変更", csvColumnMapping: "CSV 列マッピング", sourceColumn: "Source 列", optionalKeyColumn: "任意の id/key 列",
    languageColumns: "言語列（カンマ区切り）", applyMapping: "マッピングを適用", uiLanguage: "表示言語",
    diagnostics: "診断ログ", copyDiagnostics: "ログをコピー", clearDiagnostics: "ログを消去", diagnosticsCopied: "診断ログをコピーしました",
    forceMissingCells: "不足項目を強制追加", unavailableCell: "ソースファイルにこの項目はありません",
    recentProjects: "最近のプロジェクト", clearRecentProjects: "履歴を消去", noRecentProjects: "最近のプロジェクトはありません", openRecentProject: "最近のプロジェクトを開く",
  },
  en: {
    open: "Open", importCsv: "Import CSV", openProject: "Open Project", authorizeFolder: "Authorize Project Folder", csvMapping: "CSV Mapping",
    save: "Save", saveAs: "Save As", saveProject: "Save Project", saveProjectAs: "Save Project As", batchReplace: "Batch Replace", aiSettings: "AI Settings",
    search: "Search source, translation or #tag", allEntries: "All entries", complete: "Complete", incomplete: "Incomplete", languages: "Languages", allLanguages: "All languages",
    changedOnly: "Changed only", allTags: "All", emptyTag: "Empty", source: "Source", tags: "Tags", sourceTags: "Source Tag", wordTags: "Word Tag", allWordTags: "All", missingTranslation: "Missing translation",
    detailEditor: "Detail editor", noSelection: "No selection", keyContext: "Key / context", translation: "Translation", enterTranslation: "Enter translation…",
    aiSuggestion: "AI Suggestion", generate: "Generate", applySuggestion: "Apply suggestion", aiEmpty: "Generate a suggestion for the selected cell. Existing translation is never overwritten automatically.",
    aiEmptyBatch: "Will translate all empty translation cells. Existing translations are never overwritten automatically.",
    selectCell: "Select a translation cell to edit it.", completion: "Completion", renameColumns: "Rename columns", translated: "translated",
    allSaved: "All changes saved", notSaved: "not saved", projectNotSaved: "Project not saved", sourceFiles: "source files", saveFailed: "save failed", savedAndVerified: "written and verified", changedCells: "changed cells", downloadedCopy: "The browser cannot overwrite the original file, so an updated copy was downloaded",
    aiSuggestionSettings: "AI suggestion settings", provider: "Provider", providerOpenAi: "OpenAI-compatible", providerOtherCompatible: "Other-compatible", providerDeepl: "DeepL", providerHelp: "Choose the translation service for suggestions on the current cell. Existing translations are never overwritten automatically.", openAiHelp: "For OpenAI-compatible Chat Completions APIs.", otherCompatibleHelp: "Reserved for non-OpenAI protocols such as Anthropic-compatible.", deeplHelp: "For the official DeepL translation API.", providerPreset: "Service preset", disabledProvider: "Not implemented", deeplRegion: "DeepL service", deeplFree: "DeepL", deeplPro: "DeepLX", deeplRegionHelp: "Choose official DeepL or self-hosted DeepLX; the endpoint can be edited.", credentials: "Connection", apiEndpoint: "API endpoint", model: "Model", apiKey: "API key", promptTemplate: "Prompt template", promptHelp: "You can use {{language}} and {{source}} placeholders.", done: "Done",
    find: "Find", replaceWith: "Replace with", scope: "Scope", currentLanguage: "Current language", applyReplacement: "Apply replacement", matchesFound: "matches found",
    renameLanguageColumns: "Rename language columns", csvColumnMapping: "CSV column mapping", sourceColumn: "Source column", optionalKeyColumn: "Optional id/key column",
    languageColumns: "Language columns, comma separated", applyMapping: "Apply mapping", uiLanguage: "Interface language",
    diagnostics: "Diagnostic Log", copyDiagnostics: "Copy Log", clearDiagnostics: "Clear Log", diagnosticsCopied: "Diagnostic log copied",
    forceMissingCells: "Force Missing Entries", unavailableCell: "This entry does not exist in the source file",
    recentProjects: "Recent Projects", clearRecentProjects: "Clear History", noRecentProjects: "No recent projects", openRecentProject: "Open recent project",
  },
} as const;
export const AI_DEFAULT: AiSettings = {
  provider: "openai-compatible",
  openAiPreset: DEFAULT_OPENAI_PRESET,
  anthropicPreset: DEFAULT_ANTHROPIC_PRESET,
  endpoint: "",
  apiKey: "",
  model: "",
  prompt: DEFAULT_AI_PROMPT,
  deeplRegion: "deepl",
};

function aiProviderProfileKey(provider: AiProvider, presetOrRegion: string): string {
  return `${provider}:${presetOrRegion}`;
}

function activeAiProfileKey(ai: Pick<AiSettings, "provider" | "openAiPreset" | "anthropicPreset" | "deeplRegion">): string {
  if (ai.provider === "openai-compatible") return aiProviderProfileKey(ai.provider, ai.openAiPreset || DEFAULT_OPENAI_PRESET);
  if (ai.provider === "anthropic-compatible") return aiProviderProfileKey(ai.provider, ai.anthropicPreset || DEFAULT_ANTHROPIC_PRESET);
  return aiProviderProfileKey(ai.provider, ai.deeplRegion || "deepl");
}

function aiSettingsProfile(ai: AiSettings): AiSettingsProfile {
  return {
    endpoint: ai.endpoint,
    apiKey: ai.apiKey,
    model: ai.model,
    prompt: ai.prompt,
  };
}

function hasMeaningfulAiProfileValue(profile: AiSettingsProfile): boolean {
  return Boolean(profile.endpoint || profile.apiKey || profile.model || (profile.prompt && profile.prompt !== AI_DEFAULT.prompt));
}

function rememberActiveAiProfile(ai: AiSettings): AiSettings {
  const key = activeAiProfileKey(ai);
  const profile = aiSettingsProfile(ai);
  if (!hasMeaningfulAiProfileValue(profile) && !ai.profiles?.[key]) return ai;
  return {
    ...ai,
    profiles: {
      ...(ai.profiles ?? {}),
      [key]: profile,
    },
  };
}

function openAiPresetDefaults(id: string): Required<AiSettingsProfile> {
  const preset = providerPreset(OPENAI_COMPATIBLE_PRESETS, id);
  return {
    endpoint: preset.endpoint,
    apiKey: "",
    model: preset.modelPlaceholder,
    prompt: AI_DEFAULT.prompt,
  };
}

function anthropicPresetDefaults(id: string): Required<AiSettingsProfile> {
  const preset = providerPreset(ANTHROPIC_COMPATIBLE_PRESETS, id);
  return {
    endpoint: preset.endpoint,
    apiKey: "",
    model: preset.modelPlaceholder,
    prompt: AI_DEFAULT.prompt,
  };
}

function deeplDefaults(region: AiSettings["deeplRegion"]): Required<AiSettingsProfile> {
  return {
    endpoint: DEEPL_ENDPOINTS[region],
    apiKey: "",
    model: "",
    prompt: AI_DEFAULT.prompt,
  };
}

function applyAiProfile(ai: AiSettings, key: string, defaults: Required<AiSettingsProfile>): AiSettings {
  const profile = ai.profiles?.[key];
  return {
    ...ai,
    endpoint: profile?.endpoint ?? defaults.endpoint,
    apiKey: profile?.apiKey ?? defaults.apiKey,
    model: profile?.model ?? defaults.model,
    prompt: profile?.prompt ?? defaults.prompt,
  };
}

export function switchAiSettingsProfile(ai: AiSettings, target: { provider: "openai-compatible"; openAiPreset: string } | { provider: "anthropic-compatible"; anthropicPreset: string } | { provider: "deepl"; deeplRegion: AiSettings["deeplRegion"] }): AiSettings {
  const saved = rememberActiveAiProfile(ai);
  if (target.provider === "openai-compatible") {
    const preset = providerPreset(OPENAI_COMPATIBLE_PRESETS, target.openAiPreset);
    const next = { ...saved, provider: target.provider, openAiPreset: preset.id };
    return applyAiProfile(next, aiProviderProfileKey(target.provider, preset.id), openAiPresetDefaults(preset.id));
  }
  if (target.provider === "anthropic-compatible") {
    const preset = providerPreset(ANTHROPIC_COMPATIBLE_PRESETS, target.anthropicPreset);
    const next = { ...saved, provider: target.provider, anthropicPreset: preset.id };
    return applyAiProfile(next, aiProviderProfileKey(target.provider, preset.id), anthropicPresetDefaults(preset.id));
  }
  const next = { ...saved, provider: target.provider, deeplRegion: target.deeplRegion };
  return applyAiProfile(next, aiProviderProfileKey(target.provider, target.deeplRegion), deeplDefaults(target.deeplRegion));
}

// Persist AI settings (including the API key) to localStorage so the user only
// configures once per browser. Stored as plaintext — acceptable for a local-only
// tool but the user should clear the key on a shared device.
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function normalizeDeepLRegion(region: unknown): AiSettings["deeplRegion"] {
  return region === "deeplx" ? "deeplx" : "deepl";
}

function migrateDefaultAiPrompt(prompt: unknown): string | undefined {
  if (prompt === LEGACY_DEFAULT_AI_PROMPT) return DEFAULT_AI_PROMPT;
  return typeof prompt === "string" ? prompt : undefined;
}

function migrateAiProfiles(profiles: unknown): Record<string, AiSettingsProfile> | undefined {
  if (!profiles || typeof profiles !== "object") return undefined;
  return Object.fromEntries(
    Object.entries(profiles as Record<string, AiSettingsProfile>).map(([key, profile]) => [
      key,
      { ...profile, prompt: migrateDefaultAiPrompt(profile.prompt) ?? profile.prompt },
    ]),
  );
}

export function loadAiSettings(storage: StorageLike = window.localStorage): AiSettings {
  try {
    const raw = storage.getItem(AI_SETTINGS_KEY);
    if (!raw) return AI_DEFAULT;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    // Merge over defaults so older stored entries missing new fields keep working.
    const merged = { ...AI_DEFAULT, ...parsed };
    if (!["openai-compatible", "anthropic-compatible", "deepl"].includes(merged.provider)) merged.provider = AI_DEFAULT.provider;
    merged.openAiPreset ||= DEFAULT_OPENAI_PRESET;
    merged.anthropicPreset ||= DEFAULT_ANTHROPIC_PRESET;
    merged.deeplRegion = normalizeDeepLRegion(merged.deeplRegion);
    merged.prompt = migrateDefaultAiPrompt(parsed.prompt) ?? AI_DEFAULT.prompt;
    merged.profiles = migrateAiProfiles(parsed.profiles);
    return merged;
  } catch {
    return AI_DEFAULT;
  }
}

export function saveAiSettings(ai: AiSettings, storage: StorageLike = window.localStorage): void {
  try {
    storage.setItem(AI_SETTINGS_KEY, JSON.stringify(ai));
  } catch {
    // localStorage may be full or disabled (private mode). Silently skip — the
    // user just won't have their settings remembered next time.
  }
}

function documentType(name: string): SourceDocument["type"] {
  if (/\.pot$/i.test(name)) return "pot";
  if (/\.csv$/i.test(name)) return "csv";
  return "po";
}

function download(name: string, content: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function createDocument(name: string, path: string, raw: string, modifiedAt?: number, fileHandle?: FileSystemFileHandle): SourceDocument {
  const type = documentType(name);
  const headers = type === "csv" ? parseCsvRows(raw)[0] ?? [] : [];
  return {
    id: crypto.randomUUID(),
    path,
    name,
    type,
    fileHandle,
    raw,
    writable: type !== "pot",
    modifiedAt,
    language: type === "po" ? detectPoLanguage(raw, name) : undefined,
    csvMapping: type === "csv" ? defaultCsvMapping(headers) : undefined,
  };
}

function sourceDocumentLabel(document: SourceDocument): string {
  return document.path || document.name;
}

function Button({
  children,
  onClick,
  variant = "ghost",
  title,
  disabled,
  dirty,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary" | "soft";
  title?: string;
  disabled?: boolean;
  dirty?: boolean;
}) {
  return (
    <button className={`button ${variant}`} onClick={onClick} title={title} disabled={disabled}>
      {dirty ? <i className="button-dirty" aria-label="Unsaved changes" /> : null}{children}
    </button>
  );
}

function ModalFrame({ title, children, close, className = "" }: { title: string; children: React.ReactNode; close: () => void; className?: string }) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <section className={`modal ${className}`} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-button" onClick={close}><X size={16} /></button></header>
        {children}
      </section>
    </div>
  );
}

function sourceFormatLabel(project: LingridProject): "PO" | "CSV" {
  return project.documents.some((document) => document.type === "csv") ? "CSV" : "PO";
}

function sourceSaveAsLabel(language: UiLanguage, format: "PO" | "CSV"): string {
  if (language === "zh") return `${format} 另存为`;
  if (language === "ja") return `${format} を別名保存`;
  return `Save ${format} As`;
}

function demoSourceLanguageForUi(language: UiLanguage): DemoSourceLanguage {
  if (language === "zh") return "zh-CN";
  if (language === "ja") return "ja";
  return "en";
}

function isDemoProject(project: LingridProject): boolean {
  return project.documents.length === 0 && project.entries.every((entry) => entry.key.startsWith("demo\u0000"));
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function allValuesSelected(values: string[], options: string[]): boolean {
  return options.length > 0 && options.every((option) => values.includes(option));
}

function tagColor(tag: string): string {
  let hash = 0;
  for (const char of tag) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 68% 52%)`;
}

function errorDetails(error: unknown): Record<string, unknown> {
  return error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error: String(error) };
}

type ProviderHttpErrorLike = Error & { status: number; contentType: string | null; bodyPreview: string };

function isProviderHttpError(error: unknown): error is ProviderHttpErrorLike {
  return error instanceof OpenAiProviderHttpError || error instanceof DeepLProviderHttpError;
}

function cloneEntries(entries: TranslationEntry[]): EntriesSnapshot {
  return entries.map((entry) => ({
    ...entry,
    tags: [...entry.tags],
    translations: Object.fromEntries(
      Object.entries(entry.translations).map(([language, cell]) => [
        language,
        { ...cell, tags: cell.tags ? [...cell.tags] : undefined },
      ]),
    ),
  }));
}

function FilterMenu({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  return <details className="filter-menu"><summary className={`filter-toggle ${active ? "active" : ""}`}><Filter size={14} />{label}</summary><div className="filter-popover">{children}</div></details>;
}

export function App() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(() => {
    const saved = localStorage.getItem(UI_LANGUAGE_KEY);
    if (saved === "zh" || saved === "ja" || saved === "en") return saved;
    return navigator.language.startsWith("zh") ? "zh" : navigator.language.startsWith("ja") ? "ja" : "en";
  });
  const t = UI_TEXT[uiLanguage];
  const demoSourceLanguage = demoSourceLanguageForUi(uiLanguage);
  const initialDemoProject = useMemo(() => createDemoProject(demoSourceLanguage), [demoSourceLanguage]);
  const initialDemoSelection = { key: "demo\u0000menu.start", column: initialDemoProject.columnOrder[0] ?? "en" };
  const [project, setProject] = useState<LingridProject>(() => initialDemoProject);
  const [selection, setSelection] = useState<Selection>({ key: initialDemoSelection.key, language: initialDemoSelection.column });
  const [activeMatrixCell, setActiveMatrixCell] = useState<MatrixCellSelection | null>(initialDemoSelection);
  const [selectedMatrixCells, setSelectedMatrixCells] = useState<MatrixCellSelection[]>([initialDemoSelection]);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState("Demo workspace loaded");
  const [ai, setAi] = useState<AiSettings>(() => loadAiSettings());
  const [aiDraft, setAiDraft] = useState<AiSettings | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [batch, setBatch] = useState({ find: "", replace: "", scope: "current" });
  const [csvDraft, setCsvDraft] = useState({ documentId: "", sourceColumn: "", keyColumn: "", languages: "" });
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});
  const [undoStack, setUndoStack] = useState<EntriesSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EntriesSnapshot[]>([]);
  const [sourceSaveStatus, setSourceSaveStatus] = useState<SourceSaveStatus>({ kind: "idle" });
  const [draggedLanguage, setDraggedLanguage] = useState<string | null>(null);
  const [dragOverLanguage, setDragOverLanguage] = useState<string | null>(null);
  const [savedProjectSnapshot, setSavedProjectSnapshot] = useState(() => serializeProject(initialDemoProject));
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => loadRecentProjects());
  const fileInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const pendingProjectConfig = useRef<ProjectConfig | null>(null);
  const cellInputs = useRef(new Map<string, HTMLInputElement>());
  const draggedHeader = useRef(false);
  const resizingColumn = useRef<{ column: string; startX: number; startWidth: number } | null>(null);
  const saveInFlight = useRef<Promise<void> | null>(null);
  const deferredSearch = useDeferredValue(project.view.search);
  useEffect(() => {
    localStorage.setItem(UI_LANGUAGE_KEY, uiLanguage);
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);
  useEffect(() => {
    if (!isDemoProject(project)) return;
    const nextDemoProject = createDemoProject(demoSourceLanguage);
    const nextSelection = { key: "demo\u0000menu.start", column: nextDemoProject.columnOrder[0] ?? "en" };
    setProject(nextDemoProject);
    setSelection({ key: nextSelection.key, language: nextSelection.column });
    setActiveMatrixCell(nextSelection);
    setSelectedMatrixCells([nextSelection]);
    setCellDrafts({});
    setUndoStack([]);
    setRedoStack([]);
    setSourceSaveStatus({ kind: "idle" });
    setSavedProjectSnapshot(serializeProject(nextDemoProject));
  }, [demoSourceLanguage]);
  useEffect(() => {
    function closeOpenMenus(event: PointerEvent) {
      document.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
        if (!details.contains(event.target as Node)) details.removeAttribute("open");
      });
    }
    document.addEventListener("pointerdown", closeOpenMenus);
    return () => document.removeEventListener("pointerdown", closeOpenMenus);
  }, []);
  function appendDiagnostic(event: string, details: Record<string, unknown> = {}) {
    const line = `${new Date().toISOString()} ${event} ${JSON.stringify(details)}`;
    setDiagnostics((current) => [...current.slice(-999), line]);
  }

  function describeAiError(error: unknown): Record<string, unknown> {
    if (isProviderHttpError(error)) {
      return { status: error.status, contentType: error.contentType, bodyPreview: error.bodyPreview };
    }
    if (error instanceof Error) {
      return { name: error.name, message: error.message };
    }
    return { error: String(error) };
  }

  function aiRateLimitDelayMs(error: unknown): number | undefined {
    const details = describeAiError(error);
    return rateLimitRetryDelayMs(details.status, details.bodyPreview);
  }

  function aiErrorNotice(provider: AiProvider, error: unknown): string {
    const base = provider === "deepl" ? "DeepL request failed" : "AI request failed";
    if (isProviderHttpError(error)) {
      const serverMessage = extractServerMessage(error.bodyPreview);
      return serverMessage ? `${base} (HTTP ${error.status}: ${serverMessage})` : `${base} (HTTP ${error.status})`;
    }
    const message = error instanceof Error ? error.message : String(error);
    return `${base}: ${message}`;
  }

  function extractServerMessage(bodyPreview: string): string | null {
    try {
      const parsed = JSON.parse(bodyPreview) as { message?: unknown; error?: unknown; detail?: unknown };
      const candidate = parsed.message ?? parsed.error ?? parsed.detail;
      if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim();
    } catch {
      // Body wasn't JSON; ignore.
    }
    if (bodyPreview.length > 0 && bodyPreview.length < 200) return bodyPreview.trim();
    return null;
  }

  function diagnosticReport() {
    const runtime = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      electron: Boolean(window.lingrid),
      showOpenFilePicker: Boolean(window.showOpenFilePicker),
      showDirectoryPicker: Boolean(window.showDirectoryPicker),
      showSaveFilePicker: Boolean(window.showSaveFilePicker),
    };
    return [`Lingrid diagnostics`, `${new Date().toISOString()} runtime ${JSON.stringify(runtime)}`, ...diagnostics].join("\n");
  }

  async function copyDiagnostics() {
    await navigator.clipboard.writeText(diagnosticReport());
    setNotice(t.diagnosticsCopied);
  }
  const visible = useMemo(
    () => {
      const entries = filteredEntries({ ...project, view: { ...project.view, search: deferredSearch } });
      return project.view.sort ? sortedEntries(entries, project.view.sort.language, project.view.sort.mode) : entries;
    },
    [project, deferredSearch],
  );
  const matrixColumns = useMemo(() => [...project.columnOrder, TAGS_COLUMN], [project.columnOrder]);
  const selectedMatrixCellIds = useMemo(() => new Set(selectedMatrixCells.map((cell) => matrixCellKey(cell.key, cell.column))), [selectedMatrixCells]);
  const current = project.entries.find((entry) => entry.key === selection?.key);
  const currentCell = selection && current?.translations[selection.language];
  const changedCount = project.entries.reduce(
    (count, entry) => count + (entry.sourceChanged ? 1 : 0) + Object.values(entry.translations).filter((cell) => cell.changed).length,
    0,
  );
  const sourceDirty = changedCount > 0 || Object.entries(cellDrafts).some(([key, value]) => {
    const [entryKey, language] = key.split("\u0001");
    return value !== (project.entries.find((entry) => entry.key === entryKey)?.translations[language]?.value ?? "");
  });
  const projectDirty = serializeProject(project) !== savedProjectSnapshot;
  const statusLabels = [
    sourceDirty ? `${sourceFormatLabel(project)} ${t.notSaved}` : "",
    projectDirty ? t.projectNotSaved : "",
  ].filter(Boolean);
  const sourceSaveLog = sourceSaveStatus.kind === "success"
    ? `${sourceFormatLabel(project)} ${t.savedAndVerified}: ${sourceSaveStatus.changedCount} ${t.changedCells}`
    : sourceSaveStatus.kind === "download"
      ? `${t.downloadedCopy}: ${sourceSaveStatus.fileCount}`
    : sourceSaveStatus.kind === "error"
      ? `${sourceFormatLabel(project)} ${t.saveFailed}: ${sourceSaveStatus.message}`
      : "";
  const saveStatusText = [...statusLabels, sourceSaveLog].filter(Boolean).join(" · ") || t.allSaved;
  const saveStatusClass = sourceSaveStatus.kind === "error" ? "failed" : statusLabels.length ? "unsaved" : "saved";
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    project.entries.forEach((entry) => entry.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [project.entries]);
  const wordTagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    project.entries.forEach((entry) => Object.values(entry.translations).forEach((cell) => cell.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [project.entries]);

  function patchProject(patch: Partial<LingridProject>) {
    setProject((value) => ({ ...value, ...patch }));
  }

  function clearMatrixSelection() {
    setSelection(null);
    setActiveMatrixCell(null);
    setSelectedMatrixCells([]);
    setSuggestion("");
  }

  function clearMatrixSelectionFromNonCell(event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest(".translation-cell, .tag-cell, .modal")) return;
    if (target.closest(".detail-panel input, .detail-panel textarea, .detail-panel button")) return;
    clearMatrixSelection();
  }

  function recordEditHistory(entries: TranslationEntry[] = project.entries) {
    setUndoStack((stack) => [...stack.slice(-(MAX_HISTORY_STEPS - 1)), cloneEntries(entries)]);
    setRedoStack([]);
  }

  function undoEdit() {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const previous = stack[stack.length - 1];
      setRedoStack((redo) => [...redo.slice(-(MAX_HISTORY_STEPS - 1)), cloneEntries(project.entries)]);
      setProject((state) => ({ ...state, entries: cloneEntries(previous) }));
      setCellDrafts({});
      setSourceSaveStatus({ kind: "idle" });
      return stack.slice(0, -1);
    });
  }

  function redoEdit() {
    setRedoStack((stack) => {
      if (!stack.length) return stack;
      const next = stack[stack.length - 1];
      setUndoStack((undo) => [...undo.slice(-(MAX_HISTORY_STEPS - 1)), cloneEntries(project.entries)]);
      setProject((state) => ({ ...state, entries: cloneEntries(next) }));
      setCellDrafts({});
      setSourceSaveStatus({ kind: "idle" });
      return stack.slice(0, -1);
    });
  }

  function isTranslationDraftTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const draftKey = target.dataset.translationDraftKey;
    return Boolean(draftKey && draftKey in cellDrafts);
  }

  function handleUndoRedoShortcut(event: React.KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
    if (isTranslationDraftTarget(event.target)) return;
    event.preventDefault();
    if (event.shiftKey) redoEdit();
    else undoEdit();
  }

  function updateCell(entryKey: string, language: string, value: string) {
    applyMatrixValue([{ key: entryKey, column: language }], value);
  }

  function isMatrixCellEditable(entryKey: string, column: string, state: LingridProject = project): boolean {
    if (column === TAGS_COLUMN) return true;
    const entry = state.entries.find((item) => item.key === entryKey);
    return Boolean(entry && cellParticipates(entry, column, state.view.forceMissingCells));
  }

  function selectMatrixCell(cell: MatrixCellSelection, extend: boolean) {
    if (!isMatrixCellEditable(cell.key, cell.column)) return;
    setActiveMatrixCell(cell);
    if (cell.column !== TAGS_COLUMN) setSelection({ key: cell.key, language: cell.column });

    if (!extend || !activeMatrixCell) {
      setSelectedMatrixCells([cell]);
      return;
    }

    const rowKeys = visible.map((entry) => entry.key);
    const startRow = rowKeys.indexOf(activeMatrixCell.key);
    const endRow = rowKeys.indexOf(cell.key);
    const startColumn = matrixColumns.indexOf(activeMatrixCell.column);
    const endColumn = matrixColumns.indexOf(cell.column);
    if (startRow < 0 || endRow < 0 || startColumn < 0 || endColumn < 0) {
      setSelectedMatrixCells([cell]);
      return;
    }
    const [fromRow, toRow] = startRow < endRow ? [startRow, endRow] : [endRow, startRow];
    const [fromColumn, toColumn] = startColumn < endColumn ? [startColumn, endColumn] : [endColumn, startColumn];
    const cells: MatrixCellSelection[] = [];
    for (let row = fromRow; row <= toRow; row += 1) {
      for (let column = fromColumn; column <= toColumn; column += 1) {
        const next = { key: rowKeys[row], column: matrixColumns[column] };
        if (isMatrixCellEditable(next.key, next.column)) cells.push(next);
      }
    }
    setSelectedMatrixCells(cells.length ? cells : [cell]);
  }

  function matrixCellValue(cell: MatrixCellSelection): string {
    const entry = project.entries.find((item) => item.key === cell.key);
    if (!entry) return "";
    if (cell.column === TAGS_COLUMN) return entry.tags.join(" ");
    return cellDrafts[cellDraftKey(cell.key, cell.column)] ?? entry.translations[cell.column]?.value ?? "";
  }

  function selectedCellsForCommit(entryKey: string, column: string): MatrixCellSelection[] {
    const currentKey = matrixCellKey(entryKey, column);
    return selectedMatrixCells.length > 1 && selectedMatrixCellIds.has(currentKey)
      ? selectedMatrixCells
      : [{ key: entryKey, column }];
  }

  function applyMatrixValue(cells: MatrixCellSelection[], value: string) {
    setSourceSaveStatus({ kind: "idle" });
    const uniqueCells = [...new Map(cells.map((cell) => [matrixCellKey(cell.key, cell.column), cell])).values()];
    recordEditHistory();
    setCellDrafts((drafts) => {
      const next = { ...drafts };
      uniqueCells.forEach((cell) => {
        if (cell.column !== TAGS_COLUMN) delete next[cellDraftKey(cell.key, cell.column)];
      });
      return next;
    });
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => {
        const cellsForEntry = uniqueCells.filter((cell) => cell.key === entry.key);
        if (!cellsForEntry.length) return entry;
        let nextEntry = entry;
        for (const cell of cellsForEntry) {
          if (cell.column === TAGS_COLUMN) {
            const tags = value.split(/\s+/).map(normalizeTag).filter(Boolean);
            nextEntry = { ...nextEntry, tags };
            continue;
          }
          if (!nextEntry.translations[cell.column] && !state.view.forceMissingCells) continue;
          const previous = nextEntry.translations[cell.column];
          const changed = previous?.changed || value !== (previous?.value ?? "");
          nextEntry = {
            ...nextEntry,
            translations: {
              ...nextEntry.translations,
              [cell.column]: {
                ...previous,
                value,
                changed,
                neverEdited: changed ? false : previous?.neverEdited,
              },
            },
          };
        }
        return nextEntry;
      }),
    }));
  }

  function applyMatrixValues(values: Array<{ cell: MatrixCellSelection; value: string }>, options: { recordHistory?: boolean } = {}) {
    setSourceSaveStatus({ kind: "idle" });
    const uniqueValues = [...new Map(values.map((item) => [matrixCellKey(item.cell.key, item.cell.column), item])).values()];
    if (options.recordHistory !== false) recordEditHistory();
    setCellDrafts((drafts) => {
      const next = { ...drafts };
      uniqueValues.forEach(({ cell }) => {
        if (cell.column !== TAGS_COLUMN) delete next[cellDraftKey(cell.key, cell.column)];
      });
      return next;
    });
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => {
        const cellsForEntry = uniqueValues.filter(({ cell }) => cell.key === entry.key);
        if (!cellsForEntry.length) return entry;
        let nextEntry = entry;
        for (const { cell, value } of cellsForEntry) {
          if (cell.column === TAGS_COLUMN) {
            nextEntry = { ...nextEntry, tags: value.split(/\s+/).map(normalizeTag).filter(Boolean) };
            continue;
          }
          if (!nextEntry.translations[cell.column] && !state.view.forceMissingCells) continue;
          const previous = nextEntry.translations[cell.column];
          const changed = previous?.changed || value !== (previous?.value ?? "");
          nextEntry = {
            ...nextEntry,
            translations: {
              ...nextEntry.translations,
              [cell.column]: {
                ...previous,
                value,
                changed,
                neverEdited: changed ? false : previous?.neverEdited,
              },
            },
          };
        }
        return nextEntry;
      }),
    }));
  }

  function parseClipboardGrid(text: string): string[][] {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "").split("\n").map((row) => row.split("\t"));
  }

  function targetCellsFromGrid(start: MatrixCellSelection, rows: string[][]): Array<{ cell: MatrixCellSelection; value: string }> {
    const visibleKeys = visible.map((entry) => entry.key);
    const startRow = visibleKeys.indexOf(start.key);
    const startColumn = matrixColumns.indexOf(start.column);
    if (startRow < 0 || startColumn < 0) return [];
    const updates: Array<{ cell: MatrixCellSelection; value: string }> = [];
    rows.forEach((row, rowOffset) => {
      row.forEach((value, columnOffset) => {
        const key = visibleKeys[startRow + rowOffset];
        const column = matrixColumns[startColumn + columnOffset];
        if (!key || !column || !isMatrixCellEditable(key, column)) return;
        updates.push({ cell: { key, column }, value });
      });
    });
    return updates;
  }

  function handleMatrixCopy(event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, cell: MatrixCellSelection) {
    if (!(selectedMatrixCells.length > 1 && selectedMatrixCellIds.has(matrixCellKey(cell.key, cell.column)))) return;
    const visibleKeys = visible.map((entry) => entry.key);
    const rows = selectedMatrixCells.map((item) => visibleKeys.indexOf(item.key)).filter((index) => index >= 0);
    const columns = selectedMatrixCells.map((item) => matrixColumns.indexOf(item.column)).filter((index) => index >= 0);
    const selected = selectedMatrixCellIds;
    const output: string[] = [];
    for (let row = Math.min(...rows); row <= Math.max(...rows); row += 1) {
      const values: string[] = [];
      for (let column = Math.min(...columns); column <= Math.max(...columns); column += 1) {
        const next = { key: visibleKeys[row], column: matrixColumns[column] };
        values.push(selected.has(matrixCellKey(next.key, next.column)) ? matrixCellValue(next) : "");
      }
      output.push(values.join("\t"));
    }
    event.preventDefault();
    event.clipboardData.setData("text/plain", output.join("\n"));
  }

  function handleMatrixPaste(event: React.ClipboardEvent<HTMLInputElement>, cell: MatrixCellSelection) {
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;
    const rows = parseClipboardGrid(text);
    const hasTableShape = rows.length > 1 || rows.some((row) => row.length > 1);
    const selected = selectedCellsForCommit(cell.key, cell.column);
    if (selected.length <= 1 && !hasTableShape) return;
    event.preventDefault();
    if (!hasTableShape && selected.length > 1) {
      applyMatrixValue(selected, rows[0]?.[0] ?? "");
      return;
    }
    const updates = targetCellsFromGrid(cell, rows);
    if (updates.length) applyMatrixValues(updates);
  }

  function importDocuments(files: Array<{ name: string; path: string; content: string; modifiedAt?: number; fileHandle?: FileSystemFileHandle }>) {
    if (!files.length) return;
    setSourceSaveStatus({ kind: "idle" });
    setUndoStack([]);
    setRedoStack([]);
    setProject((state) => {
      let next = { ...state, documents: [...state.documents], entries: [...state.entries] };
      if (next.documents.length === 0 && next.entries[0]?.key.startsWith("demo")) next = createProject();
      if (!canImportSourceTypes(next.documents.map((document) => document.type), files.map((file) => documentType(file.name)))) {
        setNotice("PO/POT and CSV files cannot be mixed in the same project.");
        return state;
      }
      const previousCells = new Map(state.entries.flatMap((entry) =>
        Object.entries(entry.translations).map(([language, cell]) => [`${entry.key}\u0001${language}`, cell.neverEdited]),
      ));
      for (const file of files) {
        const document = createDocument(file.name, file.path, file.content, file.modifiedAt, file.fileHandle);
        const entries = document.type === "csv" ? parseCsv(document) : parsePo(document);
        const languages =
          document.type === "csv"
            ? Object.keys(document.csvMapping ?? {}).length
              ? Object.keys(document.csvMapping!.languageColumns)
              : Object.keys(entries[0]?.translations ?? {})
            : document.language
              ? [document.language]
              : [];
        next.documents.push(document);
        next.entries = mergeEntries(next.entries, entries);
        for (const language of languages) {
          if (!next.columnOrder.includes(language)) next.columnOrder.push(language);
          next.columnLabels[language] ??= language;
        }
      }
      next.entries = next.entries.map((entry) => ({
        ...entry,
        translations: Object.fromEntries(
          Object.entries(entry.translations).map(([language, cell]) => {
            const key = `${entry.key}\u0001${language}`;
            const previousNeverEdited = previousCells.get(key);
            return [language, { ...cell, neverEdited: previousNeverEdited !== undefined ? previousNeverEdited : true }];
          }),
        ),
      }));
      setNotice(`Imported ${next.documents.length} source file${next.documents.length === 1 ? "" : "s"}`);
      return next;
    });
  }

  async function openFiles() {
    if (window.lingrid) {
      const files = await window.lingrid.openFiles(["po", "pot", "csv"]);
      importDocuments(files);
    } else if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: true,
          types: [{ description: "Lingrid files", accept: { "text/plain": [".po", ".pot", ".csv"] } }],
        });
        const files = await Promise.all(handles.map(async (fileHandle) => {
          const file = await fileHandle.getFile();
          return { name: file.name, path: "", content: await file.text(), modifiedAt: file.lastModified, fileHandle };
        }));
        importDocuments(files);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") setNotice("Could not open the selected source files.");
      }
    } else {
      fileInput.current?.click();
    }
  }

  async function openProject() {
    appendDiagnostic("project.open.start", { electron: Boolean(window.lingrid) });
    if (window.lingrid) {
      const [projectFile] = await window.lingrid.openFiles(["json"]);
      if (!projectFile) return;
      const config = JSON.parse(projectFile.content) as ProjectConfig;
      appendDiagnostic("project.open.json", { path: projectFile.path, configuredFiles: config.files?.length ?? 0 });
      const { files, missingPaths } = await window.lingrid.readFiles((config.files ?? []).map((file) => file.path));
      restoreProject(config, files, projectFile.path, undefined, missingPaths);
      return;
    }

    // Browser: prefer directory picker for FILE-B workflow
    if (window.showDirectoryPicker) {
      try {
        const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        appendDiagnostic("project.open.directory", { name: directoryHandle.name });

        // Look for .lingrid.json in the selected folder
        let projectFileHandle: FileSystemFileHandle | undefined;
        try {
          projectFileHandle = await directoryHandle.getFileHandle(".lingrid.json");
        } catch {
          // .lingrid.json does not exist
        }

        if (projectFileHandle) {
          const projectFile = await projectFileHandle.getFile();
          const config = JSON.parse(await projectFile.text()) as ProjectConfig;
          appendDiagnostic("project.open.json", { name: projectFile.name, bytes: projectFile.size, modifiedAt: projectFile.lastModified, configuredFiles: config.files?.length ?? 0 });
          const { files, missingPaths } = await readBrowserProjectDirectory(directoryHandle, config);
          restoreProject(config, files, undefined, projectFileHandle, missingPaths, directoryHandle);
        } else {
          // No project file found: import source files as a new project
          setNotice("No .lingrid.json found. Importing source files from the selected folder.");
          const { files } = await readBrowserProjectDirectory(directoryHandle, { files: [] });
          if (files.length) {
            importDocuments(files);
            patchProject({ directoryHandle });
          } else {
            setNotice("No source files found in the selected folder.");
          }
        }
      } catch (error) {
        appendDiagnostic("project.open.error", errorDetails(error));
        if ((error as DOMException).name !== "AbortError") setNotice("Could not open the project folder.");
      }
      return;
    }

    // Fallback: legacy file picker for browsers without directory picker
    if (!window.showOpenFilePicker) {
      projectInput.current?.click();
      return;
    }
    try {
      const [projectFileHandle] = await window.showOpenFilePicker({
        types: [{ description: "Lingrid project", accept: { "application/json": [".json"] } }],
      });
      if (!projectFileHandle) return;
      const projectFile = await projectFileHandle.getFile();
      const config = JSON.parse(await projectFile.text()) as ProjectConfig;
      appendDiagnostic("project.open.json", { name: projectFile.name, bytes: projectFile.size, modifiedAt: projectFile.lastModified, configuredFiles: config.files?.length ?? 0 });
      const sourceHandles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: "Lingrid source files", accept: { "text/plain": [".po", ".pot", ".csv"] } }],
      });
      const files = await readBrowserSourceFiles(sourceHandles);
      restoreProject(config, files, undefined, projectFileHandle);
    } catch (error) {
      appendDiagnostic("project.open.error", errorDetails(error));
      if ((error as DOMException).name !== "AbortError") setNotice("Could not open the project JSON.");
    }
  }

  function draftCell(entryKey: string, language: string, value: string) {
    setSourceSaveStatus({ kind: "idle" });
    setCellDrafts((drafts) => ({ ...drafts, [cellDraftKey(entryKey, language)]: value }));
  }

  function commitCell(entryKey: string, language: string, mode: "single" | "batch" = "single") {
    const key = cellDraftKey(entryKey, language);
    if (!(key in cellDrafts)) return;
    const value = cellDrafts[key];
    const committed = project.entries.find((entry) => entry.key === entryKey)?.translations[language]?.value ?? "";
    if (value !== committed) {
      const cells = mode === "batch" ? selectedCellsForCommit(entryKey, language) : [{ key: entryKey, column: language }];
      applyMatrixValue(cells, value);
    }
    setCellDrafts((drafts) => {
      const next = { ...drafts };
      delete next[key];
      return next;
    });
  }

  function moveFromCell(entryKey: string, language: string, direction: "next" | "previous" | "down") {
    const next = adjacentCell(visible.map((entry) => entry.key), project.columnOrder, { key: entryKey, language }, direction);
    commitCell(entryKey, language, "batch");
    if (!next) return;
    setSelection(next);
    setActiveMatrixCell({ key: next.key, column: next.language });
    requestAnimationFrame(() => cellInputs.current.get(cellDraftKey(next.key, next.language))?.focus());
  }

  function applyCellDrafts(entries: TranslationEntry[]): TranslationEntry[] {
    return applyTranslationDrafts(entries, project.columnOrder, cellDrafts);
  }

  function cycleSort(language: string) {
    const mode = nextSortMode(project.view.sort?.language === language ? project.view.sort.mode : undefined);
    patchProject({ view: { ...project.view, sort: { language, mode } } });
  }

  function dropLanguage(targetLanguage: string, placement: "before" | "after") {
    if (draggedLanguage) patchProject({ columnOrder: reorderColumn(project.columnOrder, draggedLanguage, targetLanguage, placement) });
    setDraggedLanguage(null);
    setDragOverLanguage(null);
  }

  function columnWidth(column: string) {
    return project.columnWidths[column] ?? DEFAULT_COLUMN_WIDTHS[column as keyof typeof DEFAULT_COLUMN_WIDTHS] ?? DEFAULT_LANGUAGE_WIDTH;
  }

  function setColumnWidth(column: string, width: number) {
    patchProject({ columnWidths: { ...project.columnWidths, [column]: Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, Math.round(width))) } });
  }

  function startColumnResize(event: React.MouseEvent, column: string) {
    event.preventDefault();
    event.stopPropagation();
    resizingColumn.current = { column, startX: event.clientX, startWidth: columnWidth(column) };
    document.body.classList.add("resizing-column");
    const onMove = (moveEvent: MouseEvent) => {
      const resizing = resizingColumn.current;
      if (resizing) setColumnWidth(resizing.column, resizing.startWidth + moveEvent.clientX - resizing.startX);
    };
    const onUp = () => {
      resizingColumn.current = null;
      document.body.classList.remove("resizing-column");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function autoFitColumn(column: string) {
    const values = column === SOURCE_COLUMN
      ? ["Source", ...project.entries.map((entry) => entry.source)]
      : column === TAGS_COLUMN
        ? ["Tags", ...project.entries.map((entry) => entry.tags.join(" "))]
        : [project.columnLabels[column] ?? column, ...project.entries.map((entry) => entry.translations[column]?.value ?? "")];
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font = "12px Inter, system-ui, sans-serif";
    setColumnWidth(column, Math.max(...values.map((value) => context.measureText(value).width)) + 28);
  }

  function resizeHandle(column: string) {
    return <span className="column-resize-handle" title="Drag to resize. Double-click to fit content." onMouseDown={(event) => startColumnResize(event, column)} onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); autoFitColumn(column); }} />;
  }

  function sortIcon(language: string, mode?: TranslationSortMode) {
    if (project.view.sort?.language !== language || !mode) return null;
    if (mode === "incomplete-first") return <CircleDashed size={13} />;
    if (mode === "complete-first") return <CircleCheck size={13} />;
    if (mode === "content-asc") return <ArrowDownAZ size={13} />;
    return <ArrowUpAZ size={13} />;
  }

  async function authorizeProjectDirectory() {
    if (!pendingBrowserProject || !window.showDirectoryPicker) return;
    appendDiagnostic("directory.authorization.start", { mode: "readwrite" });
    try {
      const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      appendDiagnostic("directory.authorization.success", { name: directoryHandle.name });
      const { files, missingPaths } = await readBrowserProjectDirectory(directoryHandle, pendingBrowserProject.config);
      restoreProject(pendingBrowserProject.config, files, undefined, pendingBrowserProject.projectFileHandle, missingPaths);
      setPendingBrowserProject(null);
    } catch (error) {
      appendDiagnostic("directory.authorization.error", errorDetails(error));
      if ((error as DOMException).name !== "AbortError") setNotice("Could not read the selected project folder.");
    }
  }

  function restoreProject(config: ProjectConfig, files: BrowserSourceFile[], projectPath?: string, projectFileHandle?: FileSystemFileHandle, missingPaths: string[] = []) {
    appendDiagnostic("project.restore.start", { files: files.length, missingPaths, projectPath });
    if (!files.length) {
      setNotice(missingPaths.length ? `Could not open project: ${missingPaths.length} source file${missingPaths.length === 1 ? " is" : "s are"} missing.` : "The project has no readable source files.");
      return;
    }
    if (!canImportSourceTypes(config.files?.map((file) => file.type) ?? [], files.map((file) => documentType(file.name)))) {
      setNotice("The selected source files do not match the project format.");
      return;
    }
    let next = createProject();
    for (const file of files) {
      const stored = config.files?.find((item) => item.path && item.path === file.path)
        ?? config.files?.find((item) => item.type === documentType(file.name) && item.name === file.name);
      const document = createDocument(file.name, file.path, file.content, file.modifiedAt, file.fileHandle);
      if (stored?.csvMapping && document.type === "csv") document.csvMapping = stored.csvMapping;
      const entries = document.type === "csv" ? parseCsv(document) : parsePo(document);
      next.documents.push(document);
      next.entries = mergeEntries(next.entries, entries);
    }
    next.entries = next.entries.map((entry) => ({ ...entry, tags: config.tags?.[entry.key] ?? [] }));
    next.entries = next.entries.map((entry) => ({
      ...entry,
      translations: Object.fromEntries(Object.entries(entry.translations).map(([language, cell]) => [
        language,
        { ...cell, tags: config.wordTags?.[entry.key]?.[language] ?? [], neverEdited: config.neverEdited?.[entry.key]?.[language] ?? false },
      ])),
    }));
    next.columnOrder = config.columnOrder ?? [...new Set(next.entries.flatMap((entry) => Object.keys(entry.translations)))];
    next.columnLabels = config.columnLabels ?? Object.fromEntries(next.columnOrder.map((language) => [language, language]));
    next.columnWidths = config.columnWidths ?? {};
    next.view = normalizeProjectView();
    next.projectPath = projectPath;
    next.projectFileHandle = projectFileHandle;
    setCellDrafts({});
    setUndoStack([]);
    setRedoStack([]);
    setSourceSaveStatus({ kind: "idle" });
    setProject(next);
    setSavedProjectSnapshot(serializeProject(next));
    setSelection(next.entries[0] && next.columnOrder[0] ? { key: next.entries[0].key, language: next.columnOrder[0] } : null);
    setNotice(missingPaths.length
      ? `Opened ${files.length} source file${files.length === 1 ? "" : "s"}; skipped ${missingPaths.length} missing file${missingPaths.length === 1 ? "" : "s"}.`
      : `Opened project with ${files.length} source files`);
    appendDiagnostic("project.restore.success", { documents: next.documents.length, entries: next.entries.length, languages: next.columnOrder });
    const updatedRecent = addRecentProject(recentProjects, next, projectPath);
    setRecentProjects(updatedRecent);
    saveRecentProjects(updatedRecent);
  }

  async function readBrowserSourceFiles(handles: FileSystemFileHandle[]): Promise<BrowserSourceFile[]> {
    return Promise.all(handles.map(async (fileHandle) => {
      const file = await fileHandle.getFile();
      return { name: file.name, path: "", content: await file.text(), modifiedAt: file.lastModified, fileHandle };
    }));
  }

  async function readBrowserProjectDirectory(directoryHandle: FileSystemDirectoryHandle, config: ProjectConfig) {
    const available: BrowserSourceFile[] = [];
    appendDiagnostic("directory.scan.start", { name: directoryHandle.name, configuredFiles: config.files?.length ?? 0 });
    async function scan(directory: FileSystemDirectoryHandle, parent = "") {
      try {
        for await (const [name, handle] of directory.entries()) {
          const path = parent ? `${parent}/${name}` : name;
          if (handle.kind === "directory") {
            await scan(handle as FileSystemDirectoryHandle, path);
          } else if (/\.(po|pot|csv)$/i.test(name)) {
            try {
              const fileHandle = handle as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              available.push({ name, path, content: await file.text(), modifiedAt: file.lastModified, fileHandle });
              appendDiagnostic("directory.scan.file", { path, bytes: file.size, modifiedAt: file.lastModified });
            } catch (error) {
              appendDiagnostic("directory.scan.file.error", { path, ...errorDetails(error) });
              // Skip unreadable source files without aborting the rest of the directory scan.
            }
          }
        }
      } catch (error) {
        appendDiagnostic("directory.scan.error", { path: parent || ".", ...errorDetails(error) });
        // A broader authorized folder may contain unreadable subdirectories.
      }
    }
    await scan(directoryHandle);
    const files: BrowserSourceFile[] = [];
    const missingPaths: string[] = [];
    for (const stored of config.files ?? []) {
      let candidateIndex = available.findIndex((file) => pathsReferToSameFile(stored.path, file.path));
      if (candidateIndex < 0) candidateIndex = available.findIndex((file) => {
        if (file.name !== stored.name || documentType(file.name) !== stored.type) return false;
        return stored.type !== "po" || !stored.language || detectPoLanguage(file.content, file.name) === stored.language;
      });
      if (candidateIndex < 0) {
        missingPaths.push(stored.path || stored.name);
        appendDiagnostic("directory.match.missing", { configuredPath: stored.path, name: stored.name, type: stored.type, language: stored.language });
      } else {
        const [matched] = available.splice(candidateIndex, 1);
        files.push(matched);
        appendDiagnostic("directory.match.success", { configuredPath: stored.path, actualPath: matched.path, type: stored.type, language: stored.language });
      }
    }
    appendDiagnostic("directory.scan.complete", { matchedFiles: files.length, missingPaths, unmatchedFiles: available.map((file) => file.path) });
    return { files, missingPaths };
  }

  async function runSaveSources() {
    const entries = applyCellDrafts(project.entries);
    let documents = [...project.documents];
    appendDiagnostic("save.start", { documents: documents.length, changedCells: changedCount, drafts: Object.keys(cellDrafts).length, electron: Boolean(window.lingrid) });
    try {
      if (!documents.some((document) => document.writable)) {
        throw new Error("No writable PO or CSV source file is open.");
      }
      const serialized = documents.map((document) => ({
        document,
        raw: document.type === "csv" ? updateCsv(document, entries) : updatePo(document, entries),
      }));
      serialized.forEach(({ document, raw }) => appendDiagnostic("save.serialize", {
        path: document.path,
        name: document.name,
        type: document.type,
        writable: document.writable,
        hasFileHandle: Boolean(document.fileHandle),
        beforeBytes: new Blob([document.raw]).size,
        afterBytes: new Blob([raw]).size,
        changed: raw !== document.raw,
        modifiedAt: document.modifiedAt,
      }));
      const downloadOnly = serialized.filter(({ document, raw }) =>
        document.writable && raw !== document.raw && !((window.lingrid && document.path) || document.fileHandle));
      if (downloadOnly.length) {
        downloadOnly.forEach(({ document, raw }) => download(document.name, raw));
        setSourceSaveStatus({ kind: "download", fileCount: downloadOnly.length });
        setNotice(t.downloadedCopy);
        return;
      }
      for (let index = 0; index < documents.length; index += 1) {
        const document = documents[index];
        if (!document.writable) continue;
        const raw = serialized[index].raw;
        if (raw === document.raw) continue;
        const label = sourceDocumentLabel(document);
        let modifiedAt = document.modifiedAt;
        if (window.lingrid && document.path) {
          modifiedAt = await window.lingrid.writeFile(document.path, raw, document.modifiedAt);
        } else if (document.fileHandle) {
          modifiedAt = await writeBrowserFile(document.fileHandle, raw, document.modifiedAt, label, appendDiagnostic);
        } else {
          throw new Error(`Direct source saving needs a retained local file handle for ${label}. Reopen it in a File System Access API browser or use Electron.`);
        }
        documents[index] = { ...document, raw, modifiedAt };
      }
      const savedChangedCount = entries.reduce(
        (count, entry) => count + (entry.sourceChanged ? 1 : 0) + Object.values(entry.translations).filter((cell) => cell.changed).length,
        0,
      );
      setProject({
        ...project,
        documents,
        entries: entries.map((entry) => ({
          ...entry,
          sourceChanged: false,
          translations: Object.fromEntries(
            Object.entries(entry.translations).map(([language, cell]) => [language, { ...cell, changed: false }]),
          ),
        })),
      });
      setCellDrafts({});
      setSourceSaveStatus({ kind: "success", changedCount: savedChangedCount });
      setNotice(`${sourceFormatLabel(project)} ${t.savedAndVerified}`);
      appendDiagnostic("save.success", { changedCells: savedChangedCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not write the source file.";
      appendDiagnostic("save.error", errorDetails(error));
      setProject({ ...project, documents, entries });
      setCellDrafts({});
      setSourceSaveStatus({ kind: "error", message });
      setNotice(`${sourceFormatLabel(project)} ${t.saveFailed}: ${message}`);
    }
  }

  async function saveSources() {
    if (saveInFlight.current) {
      appendDiagnostic("save.reused", { reason: "already-running" });
      return saveInFlight.current;
    }
    const task = runSaveSources().finally(() => {
      if (saveInFlight.current === task) saveInFlight.current = null;
    });
    saveInFlight.current = task;
    return task;
  }

  async function saveProject(asNew = false) {
    const content = serializeProject(project);
    if (window.lingrid) {
      const path = asNew || !project.projectPath
        ? await window.lingrid.saveAs("lingrid-project.json", content)
        : (await window.lingrid.writeFile(project.projectPath, content), project.projectPath);
      if (!path) return;
      patchProject({ projectPath: path });
    } else if (window.showSaveFilePicker) {
      const projectFileHandle = asNew || !project.projectFileHandle
        ? await window.showSaveFilePicker({ suggestedName: "lingrid-project.json", types: [{ description: "Lingrid project", accept: { "application/json": [".json"] } }] })
        : project.projectFileHandle;
      const writable = await projectFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      patchProject({ projectFileHandle });
    } else download("lingrid-project.json", content);
    setSavedProjectSnapshot(content);
    setNotice("Project state saved");
    const updatedRecent = addRecentProject(recentProjects, project, project.projectPath ?? undefined);
    setRecentProjects(updatedRecent);
    saveRecentProjects(updatedRecent);
  }

  async function saveCurrentPoAs() {
    const csvProject = project.documents.some((item) => item.type === "csv");
    const document = csvProject
      ? project.documents.find((item) => item.type === "csv")
      : project.documents.find((item) => item.type === "po" && item.language === selection?.language);
    if (!document) return setNotice(`Select a ${csvProject ? "CSV" : "PO"} source first`);
    const entries = applyCellDrafts(project.entries);
    const content = document.type === "csv" ? updateCsv(document, entries) : updatePo(document, entries);
    if (window.lingrid) await window.lingrid.saveAs(document.name, content);
    else if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({ suggestedName: document.name });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } else download(document.name, content);
  }

  function updateTags(entryKey: string, raw: string) {
    const tags = raw.split(/\s+/).map(normalizeTag).filter(Boolean);
    recordEditHistory();
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => (entry.key === entryKey ? { ...entry, tags } : entry)),
    }));
  }

  function commitTags(entryKey: string, raw: string, mode: "single" | "batch" = "single") {
    const cells = mode === "batch" ? selectedCellsForCommit(entryKey, TAGS_COLUMN) : [{ key: entryKey, column: TAGS_COLUMN }];
    applyMatrixValue(cells, raw);
  }

  function updateWordTags(entryKey: string, language: string, raw: string) {
    const tags = raw.split(/\s+/).map(normalizeTag).filter(Boolean);
    recordEditHistory();
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => entry.key === entryKey
        ? { ...entry, translations: { ...entry.translations, [language]: { ...entry.translations[language], value: entry.translations[language]?.value ?? "", changed: entry.translations[language]?.changed ?? false, tags } } }
        : entry),
    }));
  }

  function openCsvMapping() {
    const document = project.documents.find((item) => item.type === "csv");
    if (!document?.csvMapping) return setNotice("Import a CSV file to configure its mapping");
    setCsvDraft({
      documentId: document.id,
      sourceColumn: document.csvMapping.sourceColumn,
      keyColumn: document.csvMapping.keyColumn ?? "",
      languages: Object.keys(document.csvMapping.languageColumns).join(", "),
    });
    setModal("csv");
  }

  function applyCsvMapping() {
    const documents = project.documents.map((document) => {
      if (document.id !== csvDraft.documentId) return document;
      const headers = parseCsvRows(document.raw)[0] ?? [];
      const languages = csvDraft.languages.split(",").map((value) => value.trim()).filter((value) => headers.includes(value));
      return {
        ...document,
        csvMapping: {
          sourceColumn: csvDraft.sourceColumn,
          keyColumn: csvDraft.keyColumn || undefined,
          languageColumns: Object.fromEntries(languages.map((language) => [language, language])),
        },
      };
    });
    const tags = new Map(project.entries.map((entry) => [entry.key, entry.tags]));
    const wordTags = new Map(project.entries.map((entry) => [entry.key, Object.fromEntries(Object.entries(entry.translations).map(([language, cell]) => [language, cell.tags ?? []]))]));
    const entries = documents.reduce<TranslationEntry[]>((all, document) => {
      const parsed = document.type === "csv" ? parseCsv(document) : parsePo(document);
      return mergeEntries(all, parsed);
    }, []).map((entry) => ({ ...entry, tags: tags.get(entry.key) ?? [], translations: Object.fromEntries(Object.entries(entry.translations).map(([language, cell]) => [language, { ...cell, tags: wordTags.get(entry.key)?.[language] ?? [] }])) }));
    const discoveredLanguages = [...new Set(entries.flatMap((entry) => Object.keys(entry.translations)))];
    setProject({ ...project, documents, entries, columnOrder: discoveredLanguages, columnLabels: { ...project.columnLabels, ...Object.fromEntries(discoveredLanguages.map((language) => [language, project.columnLabels[language] ?? language])) } });
    setModal(null);
    setNotice("CSV mapping updated");
  }

  // The endpoint / model shown in the AI settings modal is considered a
  // "placeholder" when it matches ANY preset's default or any DeepL region
  // endpoint. The matching logic lives in providers/placeholder-detect.ts so
  // it can be unit-tested without React.
  function selectOpenAiPreset(id: string) {
    setAiDraft((current) => current ? switchAiSettingsProfile(current, { provider: "openai-compatible", openAiPreset: id }) : current);
  }

  function selectAnthropicPreset(id: string) {
    setAiDraft((current) => current ? switchAiSettingsProfile(current, { provider: "anthropic-compatible", anthropicPreset: id }) : current);
  }

  function updateAiDraft(patch: Partial<AiSettings>) {
    setAiDraft((current) => current ? { ...current, ...patch } : current);
  }

  function openAiSettings() {
    setAiDraft(ai);
    setModal("ai");
  }

  function closeAiSettings() {
    setAiDraft(null);
    setModal(null);
  }

  function saveAiDraft() {
    if (!aiDraft) return;
    const saved = rememberActiveAiProfile(aiDraft);
    setAi(saved);
    saveAiSettings(saved);
    appendDiagnostic("ai.settings.save", {
      provider: saved.provider,
      openAiPreset: saved.openAiPreset,
      anthropicPreset: saved.anthropicPreset,
      deeplRegion: saved.deeplRegion,
      endpoint: saved.endpoint,
      model: saved.model,
      hasKey: Boolean(saved.apiKey),
      promptLength: saved.prompt.length,
    });
    setAiDraft(null);
    setModal(null);
  }

  function aiUsageLabel(settings: AiSettings): string {
    if (settings.provider === "openai-compatible") {
      const preset = providerPreset(OPENAI_COMPATIBLE_PRESETS, settings.openAiPreset);
      const model = settings.model.trim() || preset.modelPlaceholder;
      return model ? `${preset.label} · ${model}` : preset.label;
    }
    if (settings.provider === "anthropic-compatible") {
      const preset = providerPreset(ANTHROPIC_COMPATIBLE_PRESETS, settings.anthropicPreset);
      return `${preset.label} · ${t.disabledProvider}`;
    }
    return settings.deeplRegion === "deeplx" ? "DeepLX" : "DeepL";
  }

  function aiSettingsReady(): boolean {
    if (ai.provider === "anthropic-compatible") return false;
    if (ai.provider === "openai-compatible" && (!ai.endpoint || !ai.model)) return false;
    if (ai.provider === "deepl" && !ai.apiKey) return false;
    return true;
  }

  function aiPrompt(entry: TranslationEntry, language: string): string {
    const others = project.columnOrder
      .filter((lang) => lang !== language)
      .map((lang) => ({ language: lang, content: entry.translations[lang]?.value ?? "" }))
      .filter((item) => item.content.trim() !== "");

    return renderAiPromptTemplate({
      template: ai.prompt,
      language,
      source: entry.source,
      columnLabels: project.columnLabels,
      otherLanguages: others,
    });
  }

  async function requestAiTranslation(entry: TranslationEntry, language: string): Promise<{ text: string; strippedThink?: boolean; detectedSource?: string }> {
    if (ai.provider === "openai-compatible") {
      appendDiagnostic("ai.request.start", { endpoint: ai.endpoint, model: ai.model, language, sourceLength: entry.source.length });
      try {
        const result = await requestOpenAiCompatibleTranslation({ endpoint: ai.endpoint, apiKey: ai.apiKey, model: ai.model, prompt: aiPrompt(entry, language) });
        appendDiagnostic("ai.request.success", { endpoint: ai.endpoint, model: ai.model, language, rawLength: result.raw.length, strippedThink: result.strippedThink });
        return { text: result.text, strippedThink: result.strippedThink };
      } catch (error) {
        appendDiagnostic("ai.request.error", { endpoint: ai.endpoint, model: ai.model, language, ...describeAiError(error) });
        throw error;
      }
    }
    if (ai.provider === "deepl") {
      const targetLang = toDeepLTargetLanguage(language);
      appendDiagnostic("deepl.request.start", { endpoint: ai.endpoint || DEEPL_ENDPOINTS[ai.deeplRegion], region: ai.deeplRegion, targetLang, sourceLength: entry.source.length });
      try {
        const result = await requestDeepLTranslation({ endpoint: ai.endpoint, region: ai.deeplRegion, apiKey: ai.apiKey, text: entry.source, targetLang: language });
        appendDiagnostic("deepl.request.success", { targetLang, detectedSource: result.detectedSource, textLength: result.text.length });
        return { text: result.text, detectedSource: result.detectedSource };
      } catch (error) {
        appendDiagnostic("deepl.request.error", { targetLang, ...describeAiError(error) });
        throw error;
      }
    }
    throw new Error("Anthropic-compatible providers are not implemented yet.");
  }

  function emptyAiTargets(scope: "all-empty" | "selection"): Array<{ entry: TranslationEntry; language: string }> {
    const cells = scope === "selection" ? selectedMatrixCells : project.entries.flatMap((entry) => project.columnOrder.map((language) => ({ key: entry.key, column: language })));
    const unique = [...new Map(cells.map((cell) => [matrixCellKey(cell.key, cell.column), cell])).values()];
    return unique.flatMap((cell) => {
      if (cell.column === TAGS_COLUMN || !project.columnOrder.includes(cell.column)) return [];
      const entry = project.entries.find((item) => item.key === cell.key);
      if (!entry || !cellParticipates(entry, cell.column, project.view.forceMissingCells)) return [];
      const currentValue = cellDrafts[cellDraftKey(entry.key, cell.column)] ?? entry.translations[cell.column]?.value ?? "";
      return currentValue.trim() ? [] : [{ entry, language: cell.column }];
    });
  }

  async function generateBatchAi(scope: "all-empty" | "selection") {
    if (!aiSettingsReady()) {
      openAiSettings();
      return;
    }
    const targets = emptyAiTargets(scope);
    if (!targets.length) {
      setNotice(scope === "selection" ? "No empty editable cells in the selected range." : "No empty editable translation cells.");
      return;
    }
    setAiBusy(true);
    setSuggestion("");
    recordEditHistory();
    try {
      const summary = await runAdaptiveConcurrentBatch({
        items: targets,
        initialConcurrency: 4,
        retryDelayMs: aiRateLimitDelayMs,
        worker: async (target) => {
          const result = await requestAiTranslation(target.entry, target.language);
          const text = result.text.trim();
          return text ? { cell: { key: target.entry.key, column: target.language }, value: text } : undefined;
        },
        onSuccess: (update) => applyMatrixValues([update], { recordHistory: false }),
        onError: (error, target, index) => {
          appendDiagnostic("ai.batch.item.error", { index, language: target.language, sourceLength: target.entry.source.length, ...describeAiError(error) });
        },
        onProgress: (completed, total, current) => {
          setNotice(`AI translating ${completed} / ${total}; written ${current.written}; failed ${current.failed}${current.rateLimited ? "; rate limited, slowing down" : ""}.`);
        },
      });
      appendDiagnostic("ai.batch.summary", { provider: ai.provider, ...summary });
      setNotice(`AI translated ${summary.written}; skipped ${summary.skipped}; failed ${summary.failed}${summary.rateLimited ? "; rate limit handled by retry." : "."}`);
    } finally {
      setAiBusy(false);
    }
  }

  async function generateSuggestion() {
    if (selectedMatrixCells.length > 1) {
      await generateBatchAi("selection");
      return;
    }
    if (!current || !selection) {
      await generateBatchAi("all-empty");
      return;
    }
    if (!aiSettingsReady()) {
      openAiSettings();
      return;
    }
    setAiBusy(true);
    try {
      const result = await requestAiTranslation(current, selection.language);
      if (!result.text) throw new Error("empty");
      setSuggestion(result.text);
      if (result.strippedThink) appendDiagnostic("ai.stripped_think", { language: selection.language });
      if (result.detectedSource) appendDiagnostic("deepl.detected_source", { detected: result.detectedSource, requested: toDeepLTargetLanguage(selection.language) });
    } catch (error) {
      setNotice(aiErrorNotice(ai.provider, error));
    } finally {
      setAiBusy(false);
    }
  }

  function applyBatch() {
    if (!batch.find) return;
    recordEditHistory();
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => {
        const replace = (value: string) => value.split(batch.find).join(batch.replace);
        if (batch.scope === "source") {
          const source = replace(entry.source);
          return { ...entry, source, sourceChanged: entry.sourceChanged || source !== entry.source };
        }
        if (batch.scope === "tag") return { ...entry, tags: entry.tags.map(replace) };
        return {
          ...entry,
          translations: Object.fromEntries(
            Object.entries(entry.translations).map(([language, cell]) => {
              const inScope = batch.scope === "all" || language === selection?.language;
              const value = inScope ? replace(cell.value) : cell.value;
              const changed = cell.changed || value !== cell.value;
              return [language, { ...cell, value, changed, neverEdited: changed ? false : cell.neverEdited }];
            }),
          ),
        };
      }),
    }));
    setModal(null);
    setNotice("Batch replacement applied");
  }

  const batchMatches = project.entries.reduce((count, entry) => {
    if (!batch.find) return 0;
    if (batch.scope === "source") return count + entry.source.split(batch.find).length - 1;
    if (batch.scope === "tag") return count + entry.tags.join(" ").split(batch.find).length - 1;
    return count + Object.entries(entry.translations)
      .filter(([language]) => batch.scope === "all" || language === selection?.language)
      .reduce((sum, [, cell]) => sum + cell.value.split(batch.find).length - 1, 0);
  }, 0);
  const sourceFormat = sourceFormatLabel(project);
  const completionLabel = project.view.completion === "all"
    ? t.allEntries
    : `${project.view.completion === "complete" ? t.complete : t.incomplete}${project.view.completionLanguages.length ? ` · ${project.view.completionLanguages.length}` : ""}`;
  const sourceTagOptions = [...tagCounts.map(([tag]) => tag), EMPTY_TAG_FILTER];
  const wordTagOptions = [...wordTagCounts.map(([tag]) => tag), EMPTY_TAG_FILTER];
  const tagFilterLabel = project.view.tags.length ? `${t.sourceTags} · ${project.view.tags.length}` : t.sourceTags;
  const wordTagFilterLabel = project.view.wordTags.length ? `${t.wordTags} · ${project.view.wordTags.length}` : t.wordTags;
  const stats = projectStats(project);
  const aiForm = aiDraft ?? ai;
  const aiSettingsDirty = aiDraft ? JSON.stringify(aiDraft) !== JSON.stringify(ai) : false;
  const currentAiUsageLabel = aiUsageLabel(ai);

  async function handleOpenRecent(recent: RecentProject) {
    if (window.lingrid) {
      try {
        const { files: [projectFile], missingPaths: projectMissing } = await window.lingrid.readFiles([recent.path]);
        if (!projectFile || projectMissing.length) {
          setNotice(`Could not open recent project: ${recent.name}`);
          return;
        }
        const config = JSON.parse(projectFile.content) as ProjectConfig;
        const { files, missingPaths } = await window.lingrid.readFiles((config.files ?? []).map((file) => file.path));
        restoreProject(config, files, recent.path, undefined, missingPaths);
      } catch (error) {
        setNotice(`Could not open recent project: ${recent.name}`);
      }
      return;
    }
    // Browser: cannot persist file handles in localStorage; guide user to re-open manually.
    setNotice("Please use Open Project to reopen this project in the browser.");
    openProject();
  }

  function handleRemoveRecent(event: React.MouseEvent, path: string) {
    event.stopPropagation();
    const updated = removeRecentProject(recentProjects, path);
    setRecentProjects(updated);
    saveRecentProjects(updated);
  }

  function handleClearRecent() {
    clearRecentProjects();
    setRecentProjects([]);
  }

  function formatRecentTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
    if (!isDemoProject(project)) return project.columnLabels[language] ?? language;
    return ({ "zh-CN": "简中", en: "EN", ja: "JA", ko: "KO", ru: "RU" } as Record<string, string>)[language] ?? project.columnLabels[language] ?? language;
  }

  return (
    <main className="app-shell" onKeyDown={handleUndoRedoShortcut}>
      <header className="topbar" onMouseDown={clearMatrixSelectionFromNonCell}>
        <div className="brand"><div className="brand-mark"><Languages size={16} /></div><strong>Lingrid</strong><span>灵译</span></div>
        <nav className="toolbar">
          <Button onClick={openFiles}><FolderOpen size={15} />{t.open}</Button>
          <Button onClick={openFiles}><FilePlus2 size={15} />{t.importCsv}</Button>
          <Button onClick={openProject}><FileText size={15} />{t.openProject}</Button>
          {recentProjects.length > 0 ? (
            <details className="filter-menu recent-projects-menu">
              <summary className="filter-toggle"><History size={14} />{t.recentProjects}</summary>
              <div className="filter-popover recent-projects-popover">
                {recentProjects.map((recent) => (
                  <div
                    key={recent.path}
                    className="recent-project-item"
                    onClick={() => { handleOpenRecent(recent); document.querySelector<HTMLDetailsElement>(".recent-projects-menu")?.removeAttribute("open"); }}
                  >
                    <div className="recent-project-info">
                      <span className="recent-project-name">{recent.name}</span>
                      <span className="recent-project-meta">
                        <Clock size={11} />{formatRecentTime(recent.lastAccessed)}
                        {recent.languages.length > 0 ? <> · {recent.languages.length} {t.languages.toLowerCase()}</> : null}
                      </span>
                    </div>
                    <button
                      className="icon-button recent-project-remove"
                      title="Remove from history"
                      onClick={(event) => { handleRemoveRecent(event, recent.path); event.stopPropagation(); }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <div className="filter-divider" />
                <button className="recent-project-clear" onClick={() => { handleClearRecent(); document.querySelector<HTMLDetailsElement>(".recent-projects-menu")?.removeAttribute("open"); }}>
                  <Trash2 size={12} />{t.clearRecentProjects}
                </button>
              </div>
            </details>
          ) : null}
          {pendingBrowserProject ? <Button variant="soft" onClick={authorizeProjectDirectory}><FolderOpen size={15} />{t.authorizeFolder}</Button> : null}
          {project.documents.some((document) => document.type === "csv") ? <Button onClick={openCsvMapping}><Languages size={15} />{t.csvMapping}</Button> : null}
          <span className="separator" />
          <Button variant="primary" dirty={sourceDirty} onClick={saveSources}><Save size={15} />{t.save} {sourceFormat}</Button>
          <Button onClick={saveCurrentPoAs}>{sourceSaveAsLabel(uiLanguage, sourceFormat)}</Button>
          <Button dirty={projectDirty} onClick={() => saveProject(false)}><FileText size={15} />{t.saveProject}</Button>
          <Button onClick={() => saveProject(true)}>{t.saveProjectAs}</Button>
        </nav>
        <div className="toolbar right">
          <Button variant={project.view.forceMissingCells ? "soft" : "ghost"} title={t.forceMissingCells} onClick={() => patchProject({ view: { ...project.view, forceMissingCells: !project.view.forceMissingCells } })}><FilePlus2 size={15} />{t.forceMissingCells}</Button>
          <Button onClick={() => setModal("diagnostics")}><ClipboardList size={15} />{t.diagnostics}</Button>
          <Button onClick={() => setModal("batch")}><ArrowDownUp size={15} />{t.batchReplace}</Button>
          <Button variant="soft" onClick={openAiSettings}><Bot size={15} />{t.aiSettings}</Button>
          <details className="ui-language-menu">
            <summary className="ui-language-toggle" title={t.uiLanguage}>
              <Languages size={14} />
              {UI_LANGUAGES.find((language) => language.value === uiLanguage)?.label}
            </summary>
            <div className="filter-popover ui-language-popover">
              {UI_LANGUAGES.map((language) => (
                <label key={language.value}>
                  <input
                    type="radio"
                    name="ui-language"
                    checked={uiLanguage === language.value}
                    onChange={(event) => {
                      setUiLanguage(language.value);
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  />
                  {language.label}
                </label>
              ))}
            </div>
          </details>
        </div>
      </header>

      <section className="filterbar" onMouseDown={clearMatrixSelectionFromNonCell}>
        <label className="search"><Search size={15} /><input value={project.view.search} onChange={(event) => patchProject({ view: { ...project.view, search: event.target.value } })} placeholder={t.search} /></label>
        <FilterMenu label={completionLabel} active={project.view.completion !== "all"}>
          {(["all", "incomplete", "complete"] as const).map((completion) => <label key={completion}><input type="radio" checked={project.view.completion === completion} onChange={() => patchProject({ view: { ...project.view, completion } })} />{completion === "all" ? t.allEntries : completion === "complete" ? t.complete : t.incomplete}</label>)}
          {project.view.completion !== "all" ? <div className="filter-options"><strong>{t.languages}</strong><label><input type="checkbox" checked={!project.view.completionLanguages.length} onChange={() => patchProject({ view: { ...project.view, completionLanguages: [] } })} />{t.allLanguages}</label>{project.columnOrder.map((language) => <label key={language}><input type="checkbox" checked={project.view.completionLanguages.includes(language)} onChange={() => patchProject({ view: { ...project.view, completionLanguages: toggleValue(project.view.completionLanguages, language) } })} />{project.columnLabels[language] ?? language}</label>)}</div> : null}
        </FilterMenu>
        <button className={`filter-toggle ${project.view.changedOnly ? "active" : ""}`} onClick={() => patchProject({ view: { ...project.view, changedOnly: !project.view.changedOnly } })}><Filter size={14} />{t.changedOnly}</button>
        <FilterMenu label={tagFilterLabel} active={Boolean(project.view.tags.length)}>
          <label><input type="checkbox" checked={allValuesSelected(project.view.tags, sourceTagOptions)} onChange={(event) => patchProject({ view: { ...project.view, tags: event.target.checked ? sourceTagOptions : [] } })} />{t.allTags}</label>
          <div className="filter-divider" />
          <label><input type="checkbox" checked={project.view.tags.includes(EMPTY_TAG_FILTER)} onChange={() => patchProject({ view: { ...project.view, tags: toggleValue(project.view.tags, EMPTY_TAG_FILTER) } })} />{t.emptyTag}</label>
          {tagCounts.map(([tag]) => <label key={tag}><input type="checkbox" checked={project.view.tags.includes(tag)} onChange={() => patchProject({ view: { ...project.view, tags: toggleValue(project.view.tags, tag) } })} />{tag}</label>)}
        </FilterMenu>
        <FilterMenu label={wordTagFilterLabel} active={Boolean(project.view.wordTags.length || project.view.wordTagLanguages.length)}>
          <label><input type="checkbox" checked={allValuesSelected(project.view.wordTags, wordTagOptions)} onChange={(event) => patchProject({ view: { ...project.view, wordTags: event.target.checked ? wordTagOptions : [] } })} />{t.allWordTags}</label>
          <div className="filter-divider" />
          <label><input type="checkbox" checked={project.view.wordTags.includes(EMPTY_TAG_FILTER)} onChange={() => patchProject({ view: { ...project.view, wordTags: toggleValue(project.view.wordTags, EMPTY_TAG_FILTER) } })} />{t.emptyTag}</label>
          {wordTagCounts.map(([tag]) => <label key={tag}><input type="checkbox" checked={project.view.wordTags.includes(tag)} onChange={() => patchProject({ view: { ...project.view, wordTags: toggleValue(project.view.wordTags, tag) } })} />{tag}</label>)}
          <div className="filter-options"><strong>{t.languages}</strong><label><input type="checkbox" checked={!project.view.wordTagLanguages.length} onChange={() => patchProject({ view: { ...project.view, wordTagLanguages: [] } })} />{t.allLanguages}</label>{project.columnOrder.map((language) => <label key={language}><input type="checkbox" checked={project.view.wordTagLanguages.includes(language)} onChange={() => patchProject({ view: { ...project.view, wordTagLanguages: toggleValue(project.view.wordTagLanguages, language) } })} />{project.columnLabels[language] ?? language}</label>)}</div>
        </FilterMenu>
        <span className="filter-result">{visible.length} / {project.entries.length}</span>
      </section>

      <div className="workspace">
        <section className="matrix-wrap" onMouseDown={clearMatrixSelectionFromNonCell}>
          <table className="matrix" style={{ width: columnWidth(SOURCE_COLUMN) + project.columnOrder.reduce((sum, language) => sum + columnWidth(language), 0) + columnWidth(TAGS_COLUMN) }}>
            <colgroup><col style={{ width: columnWidth(SOURCE_COLUMN) }} />{project.columnOrder.map((language) => <col key={language} style={{ width: columnWidth(language) }} />)}<col style={{ width: columnWidth(TAGS_COLUMN) }} /></colgroup>
            <thead><tr><th className="source-col">{t.source}{resizeHandle(SOURCE_COLUMN)}</th>{project.columnOrder.map((language) => <th className={dragOverLanguage === language ? "drag-over" : ""} key={language} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverLanguage(language); }} onDragLeave={() => setDragOverLanguage((current) => current === language ? null : current)} onDrop={(event) => { event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); dropLanguage(language, event.clientX < bounds.left + bounds.width / 2 ? "before" : "after"); }}><button draggable className={`sort-header ${project.view.sort?.language === language ? "active" : ""} ${draggedLanguage === language ? "dragging" : ""}`} title="Click to sort. Drag to reorder columns." onClick={() => { if (!draggedHeader.current) cycleSort(language); }} onDragStart={(event) => { draggedHeader.current = true; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", language); setDraggedLanguage(language); }} onDragEnd={() => { setDraggedLanguage(null); setDragOverLanguage(null); requestAnimationFrame(() => { draggedHeader.current = false; }); }}>{matrixHeaderLabel(language)}{sortIcon(language, project.view.sort?.mode)}</button>{resizeHandle(language)}</th>)}<th>{t.tags}{resizeHandle(TAGS_COLUMN)}</th></tr></thead>
            <tbody>{visible.map((entry) => (
              <tr key={entry.key} className={entry.key === selection?.key ? "selected-row" : ""}>
                <td className="source-col"><strong>{entry.source}</strong>{entry.context ? <small>{entry.context}</small> : null}</td>
                {project.columnOrder.map((language) => {
                  const cell = entry.translations[language];
                  const editable = Boolean(cell) || project.view.forceMissingCells;
                  const selected = entry.key === selection?.key && language === selection.language;
                  const matrixSelected = selectedMatrixCellIds.has(matrixCellKey(entry.key, language));
                  const draftKey = cellDraftKey(entry.key, language);
                  return <td
                    key={language}
                    className={`translation-cell ${!editable ? "unavailable" : ""} ${selected ? "selected-cell" : ""} ${matrixSelected ? "multi-selected-cell" : ""} ${cell?.changed ? "changed" : ""}`}
                    title={!editable ? t.unavailableCell : undefined}
                    onMouseDown={(event) => {
                      if (!editable) return;
                      if (event.shiftKey) event.preventDefault();
                      selectMatrixCell({ key: entry.key, column: language }, event.shiftKey);
                      if (event.shiftKey) requestAnimationFrame(() => cellInputs.current.get(draftKey)?.focus());
                    }}
                  >
                    {cell?.tags?.length ? <span className="word-tag-markers" title={cell.tags.join(" ")}>{cell.tags.map((tag) => <i key={tag} style={{ backgroundColor: tagColor(tag) }} />)}</span> : null}
                    <input disabled={!editable} data-translation-draft-key={draftKey} ref={(input) => { if (input) cellInputs.current.set(draftKey, input); else cellInputs.current.delete(draftKey); }} value={cellDrafts[draftKey] ?? cell?.value ?? ""} onChange={(event) => draftCell(entry.key, language, event.target.value)} onBlur={() => commitCell(entry.key, language)} onCopy={(event) => handleMatrixCopy(event, { key: entry.key, column: language })} onPaste={(event) => handleMatrixPaste(event, { key: entry.key, column: language })} onKeyDown={(event) => { if (event.nativeEvent.isComposing) return; if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a" && selectedMatrixCells.length > 1 && selectedMatrixCellIds.has(matrixCellKey(entry.key, language))) event.preventDefault(); if (event.key === "Enter") { event.preventDefault(); moveFromCell(entry.key, language, "down"); } else if (event.key === "Tab") { event.preventDefault(); moveFromCell(entry.key, language, event.shiftKey ? "previous" : "next"); } }} placeholder={editable ? t.missingTranslation : ""} />
                  </td>;
                })}
                <td
                  className={`tag-cell ${selectedMatrixCellIds.has(matrixCellKey(entry.key, TAGS_COLUMN)) ? "multi-selected-cell" : ""}`}
                  onMouseDown={(event) => {
                    if (event.shiftKey) event.preventDefault();
                    selectMatrixCell({ key: entry.key, column: TAGS_COLUMN }, event.shiftKey);
                    if (event.shiftKey) requestAnimationFrame(() => event.currentTarget.querySelector("input")?.focus());
                  }}
                >
                  <input className="tag-input" value={entry.tags.join(" ")} onChange={(event) => updateTags(entry.key, event.target.value)} onCopy={(event) => handleMatrixCopy(event, { key: entry.key, column: TAGS_COLUMN })} onPaste={(event) => handleMatrixPaste(event, { key: entry.key, column: TAGS_COLUMN })} onKeyDown={(event) => { if (event.nativeEvent.isComposing) return; if (event.key === "Enter" || event.key === "Tab") { event.preventDefault(); commitTags(entry.key, event.currentTarget.value, selectedMatrixCells.length > 1 ? "batch" : "single"); } }} placeholder="#tag" />
                </td>
              </tr>
            ))}</tbody>
          </table>
        </section>

        <aside className="detail-panel" onMouseDown={clearMatrixSelectionFromNonCell}>
          <header><div><span>{t.detailEditor}</span><h2>{selection ? project.columnLabels[selection.language] ?? selection.language : t.noSelection}</h2></div><Settings2 size={16} /></header>
          {current && selection ? <>
            <label className="field-label">{t.source}</label><div className="source-preview">{current.source}</div>
            {current.context ? <><label className="field-label">{t.keyContext}</label><code>{current.context}</code></> : null}
            <label className="field-label">{t.translation}</label>
            <textarea disabled={!cellParticipates(current, selection.language, project.view.forceMissingCells)} data-translation-draft-key={cellDraftKey(current.key, selection.language)} className="translation-area" value={cellDrafts[cellDraftKey(current.key, selection.language)] ?? currentCell?.value ?? ""} onChange={(event) => draftCell(current.key, selection.language, event.target.value)} onBlur={() => commitCell(current.key, selection.language)} onKeyDown={(event) => { if (event.nativeEvent.isComposing) return; if (event.key === "Tab") { event.preventDefault(); moveFromCell(current.key, selection.language, event.shiftKey ? "previous" : "next"); } }} placeholder={cellParticipates(current, selection.language, project.view.forceMissingCells) ? t.enterTranslation : t.unavailableCell} />
            <label className="field-label">{t.sourceTags}</label>
            <input className="text-input" value={current.tags.join(" ")} onChange={(event) => updateTags(current.key, event.target.value)} placeholder="#ui #review" />
            <label className="field-label">{t.wordTags}</label>
            <input disabled={!cellParticipates(current, selection.language, project.view.forceMissingCells)} className="text-input" value={currentCell?.tags?.join(" ") ?? ""} onChange={(event) => updateWordTags(current.key, selection.language, event.target.value)} placeholder="#review #todo" />
            <section className="ai-panel"><div className="panel-heading"><span><Sparkles size={14} />{t.aiSuggestion}</span><Button onClick={generateSuggestion} disabled={aiBusy}>{aiBusy ? <RefreshCw className="spin" size={14} /> : <Sparkles size={14} />}{t.generate}</Button></div>
              <small className="ai-usage-hint">{currentAiUsageLabel}</small>
              <p>{suggestion || t.aiEmpty}</p>
              <Button variant="soft" disabled={!suggestion} onClick={() => { updateCell(current.key, selection.language, suggestion); setSuggestion(""); }}><Check size={14} />{t.applySuggestion}</Button>
            </section>
          </> : <div className="empty-detail">
              <p>{t.selectCell}</p>
              <section className="ai-panel"><div className="panel-heading"><span><Sparkles size={14} />{t.aiSuggestion}</span><Button onClick={generateSuggestion} disabled={aiBusy}>{aiBusy ? <RefreshCw className="spin" size={14} /> : <Sparkles size={14} />}{t.generate}</Button></div>
                <small className="ai-usage-hint">{currentAiUsageLabel}</small>
                <p>{t.aiEmptyBatch}</p>
              </section>
            </div>}
          <section className="stats">
            <div className="panel-heading"><span>{t.completion}</span><button className="link" onClick={() => setModal("files")}>{t.renameColumns}</button></div>
            {project.columnOrder.map((language) => {
              const { translated, total, completion } = stats.languages[language];
              return <div className="stat" key={language}><div><span>{project.columnLabels[language] ?? language}</span><b>{completion}%</b></div><div className="progress"><i style={{ width: `${completion}%` }} /></div><small>{translated} / {total} {t.translated}</small></div>;
            })}
            <div className="tag-summary"><span><Hash size={12} />{t.tags}</span>{tagCounts.map(([tag, count]) => <small key={tag}>{tag} <b>{count}</b></small>)}</div>
          </section>
        </aside>
      </div>
      <footer className="statusbar"><span><i className={saveStatusClass} />{saveStatusText}</span><span>{notice}</span><span>{project.documents.length} {t.sourceFiles} · v0.1.1</span></footer>

      <input hidden multiple ref={fileInput} type="file" accept=".po,.pot,.csv" onChange={async (event) => { const files = await Promise.all([...event.target.files ?? []].map(async (file) => ({ name: file.name, path: "", content: await file.text() }))); event.target.value = ""; if (pendingProjectConfig.current) { const config = pendingProjectConfig.current; pendingProjectConfig.current = null; restoreProject(config, files); } else importDocuments(files); }} />
      <input hidden ref={projectInput} type="file" accept=".json" onChange={async (event) => { const [file] = [...event.target.files ?? []]; event.target.value = ""; if (!file) return; try { pendingProjectConfig.current = JSON.parse(await file.text()) as ProjectConfig; setNotice("Project JSON loaded. Select its PO/CSV source files to finish reopening."); fileInput.current?.click(); } catch { setNotice("Could not parse the selected project JSON."); } }} />

      {modal === "ai" ? <ModalFrame title={t.aiSuggestionSettings} className="ai-settings-modal" close={closeAiSettings}><div className="ai-settings-panel">
        <section className="ai-settings-card">
          <div className="ai-card-heading"><strong>{t.provider}</strong><span>{t.providerHelp}</span></div>
          <fieldset className="provider-switch ai-segmented">
            <legend>{t.provider}</legend>
            <label className={aiForm.provider === "openai-compatible" ? "active" : ""}>
              <input type="radio" name="ai-provider" value="openai-compatible" checked={aiForm.provider === "openai-compatible"} onChange={() => selectOpenAiPreset(aiForm.openAiPreset)} />
              <i className="ai-option-dot" aria-hidden="true" />
              <span className="ai-option-text"><b>{t.providerOpenAi}</b><small>{t.openAiHelp}</small></span>
            </label>
            <label className={aiForm.provider === "anthropic-compatible" ? "active" : ""}>
              <input type="radio" name="ai-provider" value="anthropic-compatible" checked={aiForm.provider === "anthropic-compatible"} onChange={() => selectAnthropicPreset(aiForm.anthropicPreset)} />
              <i className="ai-option-dot" aria-hidden="true" />
              <span className="ai-option-text"><b>{t.providerOtherCompatible}</b><small>{t.otherCompatibleHelp}</small></span>
            </label>
            <label className={aiForm.provider === "deepl" ? "active" : ""}>
              <input type="radio" name="ai-provider" value="deepl" checked={aiForm.provider === "deepl"} onChange={() => setAiDraft((current) => current ? switchAiSettingsProfile(current, { provider: "deepl", deeplRegion: current.deeplRegion }) : current)} />
              <i className="ai-option-dot" aria-hidden="true" />
              <span className="ai-option-text"><b>{t.providerDeepl}</b><small>{t.deeplHelp}</small></span>
            </label>
          </fieldset>
        </section>
        <section className="ai-settings-card">
          <div className="ai-card-heading"><strong>{aiForm.provider === "deepl" ? t.providerDeepl : aiForm.provider === "anthropic-compatible" ? t.providerOtherCompatible : t.credentials}</strong><span>{aiForm.provider === "deepl" ? t.deeplRegionHelp : t.promptHelp}</span></div>
          {aiForm.provider === "openai-compatible" ? <div className="ai-form-grid">
            <fieldset className="provider-switch ai-segmented ai-preset-grid ai-field-full">
              <legend>{t.providerPreset}</legend>
              {OPENAI_COMPATIBLE_PRESETS.map((preset) => <label key={preset.id} className={`${aiForm.openAiPreset === preset.id ? "active" : ""}${preset.warning ? " warning" : ""}`}>
                <input type="radio" name="openai-preset" value={preset.id} checked={aiForm.openAiPreset === preset.id} onChange={() => selectOpenAiPreset(preset.id)} />
                <i className="ai-option-dot" aria-hidden="true" />
                <span className="ai-option-text"><b>{preset.label}</b><small>{preset.warning ?? preset.description}</small></span>
              </label>)}
            </fieldset>
            <label>{t.apiEndpoint}<input value={aiForm.endpoint} onChange={(event) => updateAiDraft({ endpoint: event.target.value })} placeholder="https://api.example.com/v1/chat/completions" /></label>
            <label>{t.model}<input value={aiForm.model} onChange={(event) => updateAiDraft({ model: event.target.value })} placeholder="model-name" /></label>
            <label>{t.apiKey}<input type="password" value={aiForm.apiKey} onChange={(event) => updateAiDraft({ apiKey: event.target.value })} onCopy={(event) => { event.clipboardData.setData("text/plain", aiForm.apiKey); event.preventDefault(); }} onCut={(event) => { event.clipboardData.setData("text/plain", aiForm.apiKey); event.preventDefault(); updateAiDraft({ apiKey: "" }); }} placeholder={providerPreset(OPENAI_COMPATIBLE_PRESETS, aiForm.openAiPreset).apiKeyPlaceholder} /></label>
            <label className="ai-field-full">{t.promptTemplate}<textarea value={aiForm.prompt} onChange={(event) => updateAiDraft({ prompt: event.target.value })} /></label>
          </div> : aiForm.provider === "anthropic-compatible" ? <div className="ai-form-grid">
            <fieldset className="provider-switch ai-segmented ai-preset-grid ai-field-full">
              <legend>{t.providerPreset}</legend>
              {ANTHROPIC_COMPATIBLE_PRESETS.map((preset) => <label key={preset.id} className={`${aiForm.anthropicPreset === preset.id ? "active" : ""} disabled-option`}>
                <input type="radio" name="anthropic-preset" value={preset.id} checked={aiForm.anthropicPreset === preset.id} onChange={() => selectAnthropicPreset(preset.id)} />
                <i className="ai-option-dot" aria-hidden="true" />
                <span className="ai-option-text"><b>{preset.label} · {t.disabledProvider}</b><small>{preset.description}</small></span>
              </label>)}
            </fieldset>
            <label>{t.apiEndpoint}<input disabled value={aiForm.endpoint} onChange={(event) => updateAiDraft({ endpoint: event.target.value })} placeholder={providerPreset(ANTHROPIC_COMPATIBLE_PRESETS, aiForm.anthropicPreset).endpoint} /></label>
            <label>{t.model}<input disabled value={aiForm.model} onChange={(event) => updateAiDraft({ model: event.target.value })} placeholder={providerPreset(ANTHROPIC_COMPATIBLE_PRESETS, aiForm.anthropicPreset).modelPlaceholder} /></label>
            <label>{t.apiKey}<input disabled type="password" value={aiForm.apiKey} onChange={(event) => updateAiDraft({ apiKey: event.target.value })} onCopy={(event) => { event.clipboardData.setData("text/plain", aiForm.apiKey); event.preventDefault(); }} onCut={(event) => { event.clipboardData.setData("text/plain", aiForm.apiKey); event.preventDefault(); updateAiDraft({ apiKey: "" }); }} placeholder={providerPreset(ANTHROPIC_COMPATIBLE_PRESETS, aiForm.anthropicPreset).apiKeyPlaceholder} /></label>
            <label className="ai-field-full">{t.promptTemplate}<textarea disabled value={aiForm.prompt} onChange={(event) => updateAiDraft({ prompt: event.target.value })} /></label>
          </div> : <div className="ai-form-grid">
            <fieldset className="provider-switch ai-segmented ai-field-full">
              <legend>{t.deeplRegion}</legend>
              <label className={aiForm.deeplRegion === "deepl" ? "active" : ""}><input type="radio" name="deepl-region" value="deepl" checked={aiForm.deeplRegion === "deepl"} onChange={() => setAiDraft((current) => current ? switchAiSettingsProfile(current, { provider: "deepl", deeplRegion: "deepl" }) : current)} /><i className="ai-option-dot" aria-hidden="true" /><span className="ai-option-text"><b>{t.deeplFree}</b><small>{DEEPL_ENDPOINTS.deepl}</small></span></label>
              <label className={aiForm.deeplRegion === "deeplx" ? "active" : ""}><input type="radio" name="deepl-region" value="deeplx" checked={aiForm.deeplRegion === "deeplx"} onChange={() => setAiDraft((current) => current ? switchAiSettingsProfile(current, { provider: "deepl", deeplRegion: "deeplx" }) : current)} /><i className="ai-option-dot" aria-hidden="true" /><span className="ai-option-text"><b>{t.deeplPro}</b><small>{DEEPL_ENDPOINTS.deeplx}</small></span></label>
            </fieldset>
            <label>{t.apiEndpoint}<input value={aiForm.endpoint} onChange={(event) => updateAiDraft({ endpoint: event.target.value })} placeholder={DEEPL_ENDPOINTS[aiForm.deeplRegion]} /></label>
            <label>{t.apiKey}<input type="password" value={aiForm.apiKey} onChange={(event) => updateAiDraft({ apiKey: event.target.value })} onCopy={(event) => { event.clipboardData.setData("text/plain", aiForm.apiKey); event.preventDefault(); }} onCut={(event) => { event.clipboardData.setData("text/plain", aiForm.apiKey); event.preventDefault(); updateAiDraft({ apiKey: "" }); }} placeholder="DeepL-Auth-Key xxxx-xxxx-xxxx-xxxx" /></label>
          </div>}
        </section>
        <footer className="ai-settings-actions"><Button variant="primary" dirty={aiSettingsDirty} onClick={saveAiDraft}>{t.done}</Button></footer>
      </div></ModalFrame> : null}

      {modal === "batch" ? <ModalFrame title={t.batchReplace} close={() => setModal(null)}><div className="form-grid">
        <label>{t.find}<input value={batch.find} onChange={(event) => setBatch({ ...batch, find: event.target.value })} /></label>
        <label>{t.replaceWith}<input value={batch.replace} onChange={(event) => setBatch({ ...batch, replace: event.target.value })} /></label>
        <label>{t.scope}<select value={batch.scope} onChange={(event) => setBatch({ ...batch, scope: event.target.value })}><option value="current">{t.currentLanguage}</option><option value="all">{t.allLanguages}</option><option value="source">{t.source}</option><option value="tag">{t.tags}</option></select></label>
        <p className="match-count">{batchMatches} {t.matchesFound}</p>
        <Button variant="primary" onClick={applyBatch}>{t.applyReplacement}</Button>
      </div></ModalFrame> : null}

      {modal === "files" ? <ModalFrame title={t.renameLanguageColumns} close={() => setModal(null)}><div className="column-list">{project.columnOrder.map((language) => <div className="column-row" key={language}><Languages size={15} /><input value={project.columnLabels[language] ?? language} onChange={(event) => patchProject({ columnLabels: { ...project.columnLabels, [language]: event.target.value } })} /><code>{language}</code></div>)}</div></ModalFrame> : null}
      {modal === "csv" ? <ModalFrame title={t.csvColumnMapping} close={() => setModal(null)}><div className="form-grid">
        <label>{t.sourceColumn}<input value={csvDraft.sourceColumn} onChange={(event) => setCsvDraft({ ...csvDraft, sourceColumn: event.target.value })} /></label>
        <label>{t.optionalKeyColumn}<input value={csvDraft.keyColumn} onChange={(event) => setCsvDraft({ ...csvDraft, keyColumn: event.target.value })} /></label>
        <label>{t.languageColumns}<input value={csvDraft.languages} onChange={(event) => setCsvDraft({ ...csvDraft, languages: event.target.value })} /></label>
        <Button variant="primary" onClick={applyCsvMapping}>{t.applyMapping}</Button>
      </div></ModalFrame> : null}
      {modal === "diagnostics" ? <ModalFrame title={t.diagnostics} close={() => setModal(null)}><div className="form-grid diagnostic-log">
        <textarea readOnly value={diagnosticReport()} />
        <div className="diagnostic-actions">
          <Button variant="soft" onClick={() => setDiagnostics([])}>{t.clearDiagnostics}</Button>
          <Button variant="primary" onClick={copyDiagnostics}>{t.copyDiagnostics}</Button>
        </div>
      </div></ModalFrame> : null}
    </main>
  );
}
