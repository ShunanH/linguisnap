import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { limit } = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    limit = limit;
    static slidingWindow() { return {}; }
  },
}));

const body = {
  text: " Ich bin müde. ",
  isPro: true,
  apiKey: "sentinel-user-key",
  provider: "openai",
  model: "test-model",
  lang: "zh-all",
};
const analysis = {
  correctedSentence: null,
  words: [],
  overallTranslation: "我很累。",
};
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("FASTAPI_BASE_URL", "https://backend.example/");
  vi.stubEnv("INTERNAL_API_TOKEN", "sentinel-service-token");
  vi.stubEnv("DEEPSEEK_DEFAULT_KEY", "sentinel-site-key");
  vi.stubEnv("KV_REST_API_URL", "https://redis.example");
  vi.stubEnv("KV_REST_API_TOKEN", "fake-redis-token");
  limit.mockReset().mockResolvedValue({ success: true });
  // No test may make a real fetch. Success responses must be configured explicitly.
  fetchMock = vi.fn().mockRejectedValue(new Error("Unmocked fetch forbidden"));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function post(value: unknown = body) {
  const { POST } = await import("../app/api/analyze/route");
  return POST(new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "192.0.2.1" },
    body: JSON.stringify(value),
  }));
}

describe("gateway request and quota boundaries", () => {
  it.each(["", "   ", 123, null])("rejects invalid text: %s", async (text) => {
    expect((await post({ ...body, text })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["", "   ", null])("requires a BYOK key: %s", async (apiKey) => {
    expect((await post({ ...body, apiKey })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["FASTAPI_BASE_URL", "INTERNAL_API_TOKEN"])("rejects missing %s", async (name) => {
    vi.stubEnv(name, "");
    expect((await post()).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects HTTP backend URLs in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FASTAPI_BASE_URL", "http://backend.example");
    expect((await post()).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards BYOK credentials and skips the site-funded quota", async () => {
    fetchMock.mockResolvedValue(Response.json(analysis));
    const response = await post();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(analysis);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(limit).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.example/analyze");
    expect(options.headers["x-internal-token"]).toBe("sentinel-service-token");
    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({ apiKey: body.apiKey, provider: body.provider, model: body.model });
    expect(payload.userMessage).toContain("Ich bin müde.");
    expect(typeof payload.systemInstruction).toBe("string");
    expect(payload.systemInstruction.length).toBeGreaterThan(0);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("uses site credentials and fixed provider/model for basic mode", async () => {
    fetchMock.mockResolvedValue(Response.json(analysis));
    expect((await post({ ...body, isPro: false })).status).toBe(200);
    expect(limit).toHaveBeenCalledWith("linguisnap:192.0.2.1");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      apiKey: "sentinel-site-key", provider: "deepseek", model: "deepseek-chat",
    });
  });

  it("rejects basic requests when the site key is missing", async () => {
    vi.stubEnv("DEEPSEEK_DEFAULT_KEY", "");
    expect((await post({ ...body, isPro: false })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects exhausted quotas without calling the backend", async () => {
    limit.mockResolvedValue({ success: false });
    expect((await post({ ...body, isPro: false })).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not spend site credits when Redis throws", async () => {
    limit.mockRejectedValue(new Error("Redis unavailable"));
    expect((await post({ ...body, isPro: false })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("upstream failures", () => {
  it.each([400, 401, 429, 502, 503, 504])("preserves a controlled backend %s", async (status) => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Controlled failure" }, { status }));
    const response = await post();
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: "Controlled failure" });
  });

  it("handles HTML error pages", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));
    expect((await post()).status).toBe(502);
  });

  it("maps a network failure to a safe public response", async () => {
    fetchMock.mockRejectedValue(new Error(`connection failed ${body.apiKey}`));
    const response = await post();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(body.apiKey);
  });

  it("maps an abort timeout to 504", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
    expect((await post()).status).toBe(504);
  });
});

describe("regressions for repaired gateway boundaries", () => {
  it("GAP-G1: missing Redis must disable site-funded requests", async () => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    fetchMock.mockResolvedValue(Response.json(analysis));
    const response = await post({ ...body, isPro: false });
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GAP-G2: reject malformed JSON as a client error", async () => {
    const { POST } = await import("../app/api/analyze/route");
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GAP-G3: reject non-boolean isPro", async () => {
    fetchMock.mockResolvedValue(Response.json(analysis));
    expect((await post({ ...body, isPro: "false" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GAP-G4: reject unsupported providers at the public boundary", async () => {
    fetchMock.mockResolvedValue(Response.json(analysis));
    expect((await post({ ...body, provider: "unknown" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GAP-G5: reject oversized sentence input before provider billing", async () => {
    fetchMock.mockResolvedValue(Response.json(analysis));
    expect((await post({ ...body, text: "x".repeat(100_001) })).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GAP-G6: classify timeout by exception name, not message wording", async () => {
    fetchMock.mockRejectedValue(new DOMException("Deadline exceeded", "TimeoutError"));
    expect((await post()).status).toBe(504);
  });
});
