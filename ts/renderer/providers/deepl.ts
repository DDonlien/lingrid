// DeepL translation provider.
// Docs: https://developers.deepl.com/docs/api-reference/translate
// DeepL uses form-urlencoded POST, "DeepL-Auth-Key" header (NOT Bearer),
// and returns { translations: [{ detected_source_language, text }] }.

export type DeepLRegion = "free" | "pro";

export const DEEPL_ENDPOINTS: Record<DeepLRegion, string> = {
  free: "https://api-free.deepl.com/v2/translate",
  pro: "https://api.deepl.com/v2/translate",
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
}

interface DeepLResponse {
  translations?: Array<{ detected_source_language?: string; text?: string }>;
  message?: string;
}

export async function requestDeepLTranslation({ endpoint, region, apiKey, text, targetLang, signal }: DeepLRequest): Promise<DeepLResult> {
  const url = endpoint?.trim() || DEEPL_ENDPOINTS[region];
  const body = new URLSearchParams({ text, target_lang: toDeepLTargetLanguage(targetLang) });
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal,
  });
  const data = (await response.json()) as DeepLResponse;
  const translation = data.translations?.[0]?.text ?? "";
  return { text: translation, detectedSource: data.translations?.[0]?.detected_source_language };
}
