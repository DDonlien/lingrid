export function aiLanguageLabel(language: string, columnLabels: Record<string, string>): string {
  const label = columnLabels[language]?.trim();
  return label || language;
}

export function renderAiPromptTemplate({
  template,
  language,
  source,
  columnLabels,
}: {
  template: string;
  language: string;
  source: string;
  columnLabels: Record<string, string>;
}): string {
  return template
    .replaceAll("{{language}}", aiLanguageLabel(language, columnLabels))
    .replaceAll("{{source}}", source);
}
