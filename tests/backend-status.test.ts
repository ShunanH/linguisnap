import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { GET } from "../app/api/backend-status/route";
beforeEach(() => {
  vi.stubEnv("FASTAPI_BASE_URL", " https://backend.example/ ");
  vi.stubEnv("INTERNAL_API_TOKEN", " internal-token ");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("checks auth without sending a provider key or paid model request", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ status: "ok", service: "linguisnap-ai-api" }));
  const response = await GET();
  expect(response.status).toBe(200);
  expect((await response.json()).code).toBe("READY");
  expect(fetch).toHaveBeenCalledWith("https://backend.example/internal/health", expect.objectContaining({ headers: { "x-internal-token": "internal-token" } }));
});
it("reports mismatched internal token", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));
  expect((await (await GET()).json()).code).toBe("INTERNAL_AUTH_FAILED");
});
it("reports old backend version", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }));
  expect((await (await GET()).json()).code).toBe("BACKEND_UPDATE_REQUIRED");
});
it("rejects missing settings before network access", async () => {
  vi.stubEnv("INTERNAL_API_TOKEN", "");
  expect((await (await GET()).json()).code).toBe("BACKEND_CONFIG_MISSING");
  expect(fetch).not.toHaveBeenCalled();
});
