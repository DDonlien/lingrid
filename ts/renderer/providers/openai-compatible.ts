// OpenAI-compatible translation provider.
// Speaks the OpenAI Chat Completions protocol; used by MiniMax / DeepSeek /
// Mistral / Cohere / OpenRouter / local Ollama, etc.
//
// Reasoning-class models (e.g. MiniMax-M2.7) wrap their final answer in
// <think>...</think>. We strip the think block and fall back to the raw
// content if no closing tag is present, so the user always sees something
// usable and never loses the model's full reasoning trace from the network log.

export interface OpenAiCompatibleRequest {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}

export interface OpenAiCompatibleResult {
  raw: string;
  text: string;
  strippedThink: boolean;
}

export function stripThinkTags(content: string): { text: string; stripped: boolean } {
  const trimmed = content.trim();
  if (trimmed.length === 0) return { text: "", stripped: false };
  const stripped = trimmed.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  // If stripping wiped everything, the model only emitted thinking. Surface
  // the think contents without the tag markers so the user sees something.
  if (stripped.length === 0) {
    const inner = trimmed.replace(/<\/?think>/g, "").trim();
    return { text: inner, stripped: false };
  }
  return { text: stripped, stripped: stripped !== trimmed };
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

export async function requestOpenAiCompatibleTranslation({ endpoint, apiKey, model, prompt, signal }: OpenAiCompatibleRequest): Promise<OpenAiCompatibleResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    signal,
  });
  if (!response.ok) {
    const { preview, contentType } = await safeReadBody(response);
    throw new ProviderHttpError(response.status, response.statusText, contentType, preview);
  }
  const data = await response.json();
  const raw = (data?.choices?.[0]?.message?.content ?? data?.translation ?? "").toString();
  const { text, stripped } = stripThinkTags(raw);
  return { raw, text, strippedThink: stripped };
}
