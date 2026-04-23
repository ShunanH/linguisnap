import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getSystemPrompt } from "@/lib/prompts";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";


const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "24 h"),
});

export async function POST(req: Request) {
  try {
    // 1. 接收前端传来的数据
    const { text, apiKey, provider, model, lang } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "请输入需要分析的句子哦" }, { status: 400 });
    }

    // 注入默认 Key
    let finalApiKey = apiKey?.trim() || "";
    let isUsingFreeTier = false; // 🛡️ 标记是否在使用学习模式的免费额度
    
    if (finalApiKey === "LINGUISNAP_SECRET_BYPASS_2026") {
      finalApiKey = process.env.DEEPSEEK_DEFAULT_KEY || "";
      isUsingFreeTier = true; // 确认为学习模式
      
      if (!finalApiKey) {
        return NextResponse.json({ 
          error: "站长还未在后台配置默认额度，请在菜单中开启专业模式，使用自己的API Key。" 
        }, { status: 500 });
      }
    }

    if (!finalApiKey) {
      return NextResponse.json({ error: "未检测到有效的API Key，请检查设置。" }, { status: 401 });
    }


    if (isUsingFreeTier) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);

      if (!success) {
        return NextResponse.json({ 
          error: "今日「学习模式」的免费体验已用完啦！请明天再来，或在菜单开启「专业模式」填入自有Key继续使用。" 
        }, { status: 429 });
      }

      console.log(`[安全日志] IP: ${ip} 消耗了一次免费额度。今日剩余: ${remaining}/${limit}`);
    }
    // ==========================================

    // 3. 动态组装 Prompt
    const systemInstruction = getSystemPrompt(lang);
    const userMessage = `待分析句子: "${text.trim()}"`;
    const finalPrompt = `${systemInstruction}\n\n${userMessage}`;

    let responseText = "";

    // 4. 🌟 多模型路由分发网络 🌟
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: finalApiKey });
      const response = await openai.chat.completions.create({
        model: model || "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1, 
        response_format: { type: "json_object" } 
      });
      responseText = response.choices[0].message.content || "";

    } else if (provider === "deepseek") {
      const openai = new OpenAI({ 
        apiKey: finalApiKey,
        baseURL: "https://api.deepseek.com", 
      });
      const response = await openai.chat.completions.create({
        model: model || "deepseek-chat",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } 
      });
      responseText = response.choices[0].message.content || "";

    } else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey: finalApiKey });
      const response = await anthropic.messages.create({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        temperature: 0.1,
        system: systemInstruction, 
        messages: [{ role: "user", content: userMessage }]
      });
      const textBlock = response.content.find(block => block.type === 'text');
      responseText = textBlock ? textBlock.text : "";

    } else {
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      const response = await ai.models.generateContent({
        model: model || "gemini-3.0-preview", 
        contents: finalPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1, 
        }
      });
      responseText = response.text || "";
    }

    if (!responseText) {
      throw new Error("EMPTY_RESPONSE");
    }

    console.log(`=== API 原始返回数据 ===`);
    console.log(responseText);
    console.log("============================");

    // 5. 正则清洗 Markdown 标签
    responseText = responseText.replace(/^```json\n?|```$/g, '').trim();

    // 6. 解析并返回
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (jsonError) {
      throw new Error("JSON_PARSE_ERROR");
    }

  } catch (error: any) {
    console.error("API 分析出错:", error);
    
    const errorMsg = error.message || "";
    let friendlyMessage = `哎呀，服务器开小差了。真实死因：${errorMsg}`;

    if (errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("overloaded")) {
      friendlyMessage = "当前 AI 算力太挤了，服务器有点超载。稍等几秒钟再试一次吧！";
    } else if (errorMsg === "JSON_PARSE_ERROR" || errorMsg.includes("SyntaxError")) {
      friendlyMessage = "AI 这次吐出的数据格式有点乱，没能成功拼装成卡片。请再点一次发送！";
    } else if (errorMsg === "EMPTY_RESPONSE") {
      friendlyMessage = "AI 暂时陷入了沉思，什么也没返回，请重试。";
    } else if (errorMsg.includes("API key not valid") || errorMsg.includes("Incorrect API key") || errorMsg.includes("invalid x-api-key") || errorMsg.includes("Authentication Fails")) {
      friendlyMessage = "API Key 好像不正确或已失效，请重新检查一下~";
    } else if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("insufficient_quota")) {
      friendlyMessage = "API 额度好像用完了，或者请求太频繁，请检查账单或稍后再试。";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}