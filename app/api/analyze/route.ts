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

const redisUrl =
  process.env
    .KV_REST_API_URL;

const redisToken =
  process.env
    .KV_REST_API_TOKEN;

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis:
          new Redis({
            url: redisUrl,
            token:
              redisToken,
          }),

        limiter:
          Ratelimit.slidingWindow(
            20,
            "24 h"
          ),
      })
    : null;

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      text,
      isPro = true,
      apiKey,
      provider =
        "deepseek",
      model =
        "deepseek-chat",
      lang = "zh-all",
    } = body;

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

      finalModel =
        "deepseek-chat";

      finalApiKey =
        process.env
          .DEEPSEEK_DEFAULT_KEY ||
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

    const fastApiBaseUrl =
      process.env
        .FASTAPI_BASE_URL;

    const internalToken =
      process.env
        .INTERNAL_API_TOKEN;

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

    const systemInstruction =
      getSystemPrompt(lang);

    const userMessage =
      `待分析句子: "${text.trim()}"`;

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
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
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
          "LinguiSnap 暂时无法连接 AI 服务，请稍后重试。",
      },
      {
        status: 503,
      }
    );
  }
}