import { describe, expect, it } from "vitest";
import { normalizeModel } from "../lib/models";
describe("model preferences", () => {
  it("migrates retired DeepSeek selection", () => expect(normalizeModel("deepseek", "deepseek-chat")).toBe("deepseek-flash"));
  it("replaces unavailable saved models with a dropdown option", () => expect(normalizeModel("openai", " custom-model ")).toBe("gpt-4.1-mini"));
  it("fills absent selection from provider default", () => expect(normalizeModel("gemini", undefined)).toBe("gemini-3.8-flash"));
});
