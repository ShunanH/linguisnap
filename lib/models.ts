export const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
  deepseek: [{ id: "deepseek-flash", name: "DeepSeek Flash" }],
  openai: [{ id: "gpt-4.1-mini", name: "GPT-4.1 Mini" }, { id: "gpt-4.1", name: "GPT-4.1" }],
  gemini: [{ id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" }],
  anthropic: [{ id: "claude-haiku-5-5", name: "Claude Haiku 5.5" }, { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" }],
};

export function normalizeModel(provider: string, model: unknown): string {
  const value = typeof model === "string" ? model.trim() : "";
  if (provider === "deepseek" && value === "deepseek-chat") return "deepseek-flash";
  const models = PROVIDER_MODELS[provider] || [];
  return models.some((item) => item.id === value) ? value : models[0]?.id || "";
}
