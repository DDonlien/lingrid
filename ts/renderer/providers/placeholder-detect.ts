// Pure helpers for detecting whether a stored endpoint or model still matches
// any preset's default placeholder. Used by the AI settings modal to decide
// whether a preset switch should overwrite the user's value with the new
// preset's defaults, or leave the user's hand-typed value intact.

import { DEEPL_ENDPOINTS } from "./deepl";
import { ANTHROPIC_COMPATIBLE_PRESETS, OPENAI_COMPATIBLE_PRESETS } from "./presets";

export function isKnownPlaceholderEndpoint(endpoint: string | undefined | null): boolean {
  if (!endpoint) return true;
  if (endpoint === DEEPL_ENDPOINTS.deepl || endpoint === DEEPL_ENDPOINTS.deeplx) return true;
  for (const preset of OPENAI_COMPATIBLE_PRESETS) {
    if (endpoint === preset.endpoint) return true;
  }
  for (const preset of ANTHROPIC_COMPATIBLE_PRESETS) {
    if (endpoint === preset.endpoint) return true;
  }
  return false;
}

export function isKnownPlaceholderModel(model: string | undefined | null): boolean {
  if (!model) return true;
  for (const preset of OPENAI_COMPATIBLE_PRESETS) {
    if (model === preset.modelPlaceholder) return true;
  }
  for (const preset of ANTHROPIC_COMPATIBLE_PRESETS) {
    if (model === preset.modelPlaceholder) return true;
  }
  return false;
}
