// DeepL translation provider.
// Docs: https://developers.deepl.com/docs/api-reference/translate
// DeepL uses form-urlencoded POST, "DeepL-Auth-Key" header (NOT Bearer),
// and returns { translations: [{ detected_source_language, text }] }.

export type DeepLRegion = "deepl" | "deeplx";

export const DEEPL_ENDPOINTS: Record<DeepLRegion, string> = {
  deepl: "https://api.deepl.com/v2/translate",
  deeplx: "http://localhost:1188/translate",
};

// DeepL uses uppercase ISO codes with optional regional variants.
// We accept the lower-case / dash form common in PO files and normalize.
const LANG_MAP: Record<string, string> = {
  bg: "BG",
  cs: "CS",
  da: "DA",
  de: "DE",
  el: "EL",
  en: "EN-US",
  "en-gb": "EN-GB",
  "en-us": "EN-US",
  es: "ES",
  et: "ET",
  fi: "FI",
  fr: "FR",
  hu: "HU",
  id: "ID",
  it: "IT",
  ja: "JA",
  ko: "KO",
  lt: "LT",
  lv: "LV",
  nb: "NB",
  nl: "NL",
  pl: "PL",
  "pt-br": "PT-BR",
  "pt-pt": "PT-PT",
  pt: "PT-PT",
  ro: "RO",
  ru: "RU",
  sk: "SK",
  sl: "SL",
  sv: "SV",
  tr: "TR",
  uk: "UK",
  zh: "ZH-HANS",
  "zh-cn": "ZH-HANS",
  "zh-hans": "ZH-HANS",
  "zh-tw": "ZH-HANT",
  "zh-hant": "ZH-HANT",
};

export function toDeepLTargetLanguage(language: string): string {
  const normalized = language.trim().toLowerCase();
  return LANG_MAP[normalized] ?? language.trim().toUpperCase();
}

export interface DeepLRequest {
  endpoint?: string;
  region: DeepLRegion;
  apiKey: string;
  text: string;
  targetLang: string;
  signal?: AbortSignal;
}

export interface DeepLResult {
  text: string;
  detectedSource?: string;
  rawBody?: unknown;
}

interface DeepLResponse {
  translations?: Array<{ detected_source_language?: string; text?: string }>;
  data?: string | { text?: string; translation?: string };
  translation?: string;
  text?: string;
  message?: string;
}

const RESPONSE_BODY_PREVIEW = 600;

async function safeReadBody(response: Response): Promise<{ preview: string; contentType: string | null }> {
  const contentType = response.headers.get("content-type");
  try {
    const text = await response.text();
    return { preview: text.length > RESPONSE_BODY_PREVIEW ? `${text.slice(0, RESPONSE_BODY_PREVIEW)}…(truncated)` : text, contentType };
  } catch (error) {
    return { preview: `<body read failed: ${(error as Error).message}>`, contentType };
  }
}

export class ProviderHttpError extends Error {
  readonly status: number;
  readonly contentType: string | null;
  readonly bodyPreview: string;
  constructor(status: number, statusText: string, contentType: string | null, bodyPreview: string) {
    super(`HTTP ${status} ${statusText}`.trim());
    this.name = "ProviderHttpError";
    this.status = status;
    this.contentType = contentType;
    this.bodyPreview = bodyPreview;
  }
}

export async function requestDeepLTranslation({ endpoint, region, apiKey, text, targetLang, signal }: DeepLRequest): Promise<DeepLResult> {
  const url = endpoint?.trim() || DEEPL_ENDPOINTS[region];
  const target = toDeepLTargetLanguage(targetLang);
  const body = region === "deeplx"
    ? JSON.stringify({ text, target_lang: target, source_lang: "auto" })
    : new URLSearchParams({ text, target_lang: target }).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: region === "deeplx"
      ? { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) }
      : { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal,
  });
  if (!response.ok) {
    const { preview, contentType } = await safeReadBody(response);
    throw new ProviderHttpError(response.status, response.statusText, contentType, preview);
  }
  const data = (await response.json()) as DeepLResponse;
  const translation = data.translations?.[0]?.text
    ?? (typeof data.data === "string" ? data.data : data.data?.text ?? data.data?.translation)
    ?? data.translation
    ?? data.text
    ?? "";
  return { text: translation, detectedSource: data.translations?.[0]?.detected_source_language, rawBody: data };
}
