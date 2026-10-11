import {
  getSystemPrompt,
} from "@/lib/prompts";

import {
  Ratelimit,
} from "@upstash/ratelimit";

import {
  Redis,
} from "@upstash/redis";

import {
  NextResponse,
} from "next/server";

function makeRateLimit() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!url || !token) return null;
  return new Ratelimit({ redis: new Redis({ url, token }), limiter: Ratelimit.slidingWindow(20, "24 h") });
}

export async function POST(
  req: Request
) {
  let stage = "request";
  const requestId = crypto.randomUUID();
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "请求必须是有效 JSON。" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "请求必须是 JSON 对象。" }, { status: 400 });
    }

    const {
      text,
      isPro = true,
      apiKey,
      provider =
        "deepseek",
      model =
        "deepseek-flash",
      lang = "zh-all",
    } = body as Record<string, unknown>;

    if (typeof isPro !== "boolean" || typeof provider !== "string" ||
        !["openai", "deepseek", "anthropic", "gemini"].includes(provider) ||
        typeof model !== "string" || !model.trim() || model.length > 200 ||
        typeof lang !== "string" || lang.length > 50) {
      return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
    }

    if (
      typeof text !==
        "string" ||
      !text.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "请输入需要分析的句子。",
        },
        {
          status: 400,
        }
      );
    }

    if (text.length > 10_000) {
      return NextResponse.json({ error: "输入不能超过 10000 个字符。" }, { status: 413 });
    }

    let finalApiKey = "";
    let finalProvider =
      provider;

    let finalModel =
      model;

    /*
     * BYOK mode
     *
     * The key exists only in this request.
     * We do NOT write it to storage or logs.
     */
    if (isPro) {
      if (
        typeof apiKey !==
          "string" ||
        !apiKey.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "专业模式需要提供 API Key。",
          },
          {
            status: 401,
          }
        );
      }

      finalApiKey =
        apiKey.trim();

    } else {
      /*
       * Basic mode uses the site's own
       * DeepSeek key.
       */
      finalProvider =
        "deepseek";

      finalModel = (process.env.DEEPSEEK_DEFAULT_MODEL || "deepseek-flash").trim();

      finalApiKey =
        process.env
          .DEEPSEEK_DEFAULT_KEY?.trim() ||
        "";

      if (!finalApiKey) {
        return NextResponse.json(
          {
            error:
              "当前未提供免费额度，请在专业模式中使用自己的 API Key。",
          },
          {
            status: 503,
          }
        );
      }

      /*
       * Only site-funded requests
       * consume the free quota.
       */
      stage = "quota";
      const ratelimit = makeRateLimit();
      if (!ratelimit) {
        return NextResponse.json({ error: "免费额度服务暂不可用，请使用自己的 API Key。" }, { status: 503 });
      }
      if (ratelimit) {
        const forwarded =
          req.headers.get(
            "x-forwarded-for"
          );

        const ip =
          forwarded
            ?.split(",")[0]
            ?.trim() ||
          "127.0.0.1";

        const {
          success,
        } =
          await ratelimit.limit(
            `linguisnap:${ip}`
          );

        if (!success) {
          return NextResponse.json(
            {
              error:
                "今日免费解析次数已用完，请切换到专业模式使用自己的 API Key。",
            },
            {
              status: 429,
            }
          );
        }
      }
    }

    stage = "configuration";
    const fastApiBaseUrl = process.env.FASTAPI_BASE_URL?.trim();

    const internalToken = process.env.INTERNAL_API_TOKEN?.trim();

    if (
      !fastApiBaseUrl ||
      !internalToken
    ) {
      return NextResponse.json(
        {
          error:
            "LinguiSnap AI backend 尚未配置。",
        },
        {
          status: 503,
        }
      );
    }

    /*
     * Production service-to-service traffic
     * should use HTTPS.
     *
     * localhost HTTP is allowed only
     * during development.
     */
    if (
      process.env.NODE_ENV ===
        "production" &&
      !fastApiBaseUrl.startsWith(
        "https://"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI backend configuration is not secure.",
        },
        {
          status: 500,
        }
      );
    }

    const parsedBaseUrl = new URL(fastApiBaseUrl);
    if (parsedBaseUrl.username || parsedBaseUrl.password || parsedBaseUrl.search || parsedBaseUrl.hash ||
        !/^[\x21-\x7E]+$/.test(internalToken)) {
      return NextResponse.json({ error: "后端连接配置格式无效，请检查服务地址与内部口令。", code: "BACKEND_CONFIG_INVALID" }, { status: 500 });
    }

    const systemInstruction =
      getSystemPrompt(lang);

    const userMessage =
      `待分析句子: "${text.trim()}"`;

    stage = "backend_connection";
    const upstream =
      await fetch(
        `${fastApiBaseUrl.replace(
          /\/$/,
          ""
        )}/analyze`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-internal-token":
              internalToken,
          },

          cache: "no-store",

          signal:
            AbortSignal.timeout(
              60_000
            ),

          body:
            JSON.stringify({
              apiKey:
                finalApiKey,

              provider:
                finalProvider,

              model:
                finalModel,

              systemInstruction,

              userMessage,
            }),
        }
      );

    const raw =
      await upstream.text();

    let upstreamData:
      | Record<
          string,
          unknown
        >
      | null = null;

    try {
      upstreamData =
        JSON.parse(raw);
    } catch {
      return NextResponse.json(
        {
          error:
            "AI backend 返回了无法解析的数据。",
        },
        {
          status: 502,
        }
      );
    }

    if (!upstream.ok) {
      if (upstream.status === 401 && upstreamData?.detail === "Unauthorized internal request.") {
        console.error("[analyze]", { requestId, stage: "backend_auth", code: "INTERNAL_AUTH_FAILED" });
        return NextResponse.json({ error: `网站前后端内部鉴权失败，请联系站点维护者。错误编号：${requestId}`, code: "INTERNAL_AUTH_FAILED", requestId }, { status: 502 });
      }
      const detail =
        typeof upstreamData
          ?.detail ===
        "string"
          ? upstreamData.detail
          : "AI backend request failed.";

      return NextResponse.json(
        {
          error: detail,
        },
        {
          status:
            upstream.status,
        }
      );
    }

    return NextResponse.json(
      upstreamData,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error: unknown
  ) {
    /*
     * Deliberately do not log request bodies
     * or user API keys here.
     */
    const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
    const transportCode = typeof cause?.code === "string" && /^[A-Z0-9_]+$/.test(cause.code) ? cause.code : undefined;
    console.error("[analyze]", { requestId, stage, code: transportCode || "REQUEST_FAILED" });
    if (stage === "quota") {
      return NextResponse.json({ error: `免费额度服务连接失败，请暂用专业模式。错误编号：${requestId}`, code: "QUOTA_UNAVAILABLE", requestId }, { status: 503 });
    }
    if (stage === "configuration") {
      return NextResponse.json({ error: "后端连接配置格式无效，请检查 FASTAPI_BASE_URL。", code: "BACKEND_CONFIG_INVALID", requestId }, { status: 500 });
    }
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) ||
      message.includes(
        "timeout"
      ) ||
      message.includes(
        "aborted"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI 服务响应超时，请稍后重试。",
        },
        {
          status: 504,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          `网站暂时无法连接分析后端。错误编号：${requestId}`,
          code: "BACKEND_UNREACHABLE",
          requestId,
      },
      {
        status: 503,
      }
    );
  }
}
