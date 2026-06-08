export type ProviderPresetStatus = "ready" | "disabled";

export interface ProviderPreset {
  id: string;
  label: string;
  endpoint: string;
  modelPlaceholder: string;
  apiKeyPlaceholder: string;
  description: string;
  status: ProviderPresetStatus;
  warning?: string;
}

export const OPENAI_COMPATIBLE_PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    modelPlaceholder: "gpt-4o-mini",
    apiKeyPlaceholder: "sk-...",
    description: "官方 Chat Completions API。",
    status: "ready",
  },
  {
    id: "kimi",
    label: "Kimi / Moonshot",
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    modelPlaceholder: "kimi-latest",
    apiKeyPlaceholder: "sk-...",
    description: "Moonshot OpenAI-compatible HTTP API。",
    status: "ready",
  },
  {
    id: "minimax",
    label: "MiniMax",
    endpoint: "https://api.minimax.io/v1/chat/completions",
    modelPlaceholder: "MiniMax-M2.7",
    apiKeyPlaceholder: "Bearer token",
    description: "MiniMax OpenAI-Compatible API。",
    status: "ready",
  },
  {
    id: "qwen",
    label: "通义千问 / DashScope",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelPlaceholder: "qwen-plus",
    apiKeyPlaceholder: "sk-...",
    description: "阿里云百炼 OpenAI 兼容模式。",
    status: "ready",
  },
  {
    id: "doubao",
    label: "豆包 / 火山方舟",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    modelPlaceholder: "doubao-seed-1-6",
    apiKeyPlaceholder: "火山方舟 API Key",
    description: "火山方舟兼容 OpenAI SDK。",
    status: "ready",
  },
  {
    id: "gemini",
    label: "Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelPlaceholder: "gemini-2.5-flash",
    apiKeyPlaceholder: "Google AI Studio API key",
    description: "Gemini OpenAI compatibility endpoint。",
    status: "ready",
  },
  {
    id: "claude-openai",
    label: "Claude OpenAI SDK compatibility",
    endpoint: "https://api.anthropic.com/v1/chat/completions",
    modelPlaceholder: "claude-sonnet-4-5",
    apiKeyPlaceholder: "Anthropic API key",
    description: "Anthropic OpenAI SDK compatibility。",
    status: "ready",
    warning: "官方说明该兼容层适合测试和对比；长期生产优先使用 Claude native API。",
  },
  {
    id: "custom",
    label: "自定义 OpenAI 兼容",
    endpoint: "",
    modelPlaceholder: "model-name",
    apiKeyPlaceholder: "API key, if required",
    description: "填写任意 OpenAI-compatible Chat Completions endpoint。",
    status: "ready",
  },
];

export const ANTHROPIC_COMPATIBLE_PRESETS: ProviderPreset[] = [
  {
    id: "claude-native",
    label: "Anthropic / Claude native",
    endpoint: "https://api.anthropic.com/v1/messages",
    modelPlaceholder: "claude-sonnet-4-5",
    apiKeyPlaceholder: "Anthropic API key",
    description: "Claude Messages API，后续单独 adapter 实现。",
    status: "disabled",
  },
  {
    id: "minimax-anthropic",
    label: "MiniMax Anthropic-compatible",
    endpoint: "https://api.minimax.io/v1/messages",
    modelPlaceholder: "MiniMax-M2.7",
    apiKeyPlaceholder: "Bearer token",
    description: "MiniMax Anthropic-compatible 路径，后续单独 adapter 实现。",
    status: "disabled",
  },
  {
    id: "custom-anthropic",
    label: "自定义 Anthropic-compatible",
    endpoint: "",
    modelPlaceholder: "model-name",
    apiKeyPlaceholder: "API key",
    description: "预留自定义 Anthropic-compatible endpoint。",
    status: "disabled",
  },
];

export function providerPreset(presets: ProviderPreset[], id: string | undefined): ProviderPreset {
  return presets.find((preset) => preset.id === id) ?? presets[presets.length - 1];
}
