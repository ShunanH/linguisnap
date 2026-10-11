import { NextResponse } from "next/server";

export async function GET() {
  const requestId = crypto.randomUUID();
  const reply = (status: number, code: string, message: string) => NextResponse.json(
    { code, message, requestId }, { status, headers: { "Cache-Control": "no-store" } });
  const base = process.env.FASTAPI_BASE_URL?.trim();
  const token = process.env.INTERNAL_API_TOKEN?.trim();
  if (!base || !token) return reply(503, "BACKEND_CONFIG_MISSING", "当前部署缺少后端地址或内部口令。");
  let url: URL;
  try {
    url = new URL(base);
    if ((process.env.NODE_ENV === "production" && url.protocol !== "https:") || url.username || url.password || url.search || url.hash || !/^[\x21-\x7E]+$/.test(token)) throw new Error();
  } catch {
    return reply(500, "BACKEND_CONFIG_INVALID", "当前部署的后端连接配置格式无效。");
  }
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/internal/health`, {
      headers: { "x-internal-token": token }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401) return reply(502, "INTERNAL_AUTH_FAILED", "已连接到后端，但当前前端与运行中的后端口令不一致。");
    if (response.status === 404) return reply(503, "BACKEND_UPDATE_REQUIRED", "后端尚未部署连接检查接口，请等待 AWS 部署完成。");
    if (!response.ok) return reply(502, "BACKEND_NOT_READY", "后端尚未就绪，请查看 AWS 服务日志。");
    const body = await response.json();
    if (body.status !== "ok" || body.service !== "linguisnap-ai-api") return reply(502, "UNEXPECTED_BACKEND", "后端地址返回了非预期的服务响应。");
    return reply(200, "READY", "后端连接与内部鉴权正常，可以开始分析。");
  } catch (error) {
    const cause = error instanceof Error ? error.cause as { code?: unknown } | undefined : undefined;
    const code = typeof cause?.code === "string" && /^[A-Z0-9_]+$/.test(cause.code) ? cause.code : "CONNECTION_FAILED";
    console.error("[backend-status]", { requestId, code });
    return reply(503, "BACKEND_UNREACHABLE", "当前前端无法连接后端；请凭错误编号查询 Vercel 运行日志。");
  }
}
