import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSystemPrompt } from "@/lib/prompts"; 

export async function POST(req: Request) {
  try {
    // 1. 接收前端传来的数据
    const { text, apiKey, provider, lang } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "请输入需要分析的句子哦" }, { status: 400 });
    }

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({ error: "请先在上方配置你的 API Key" }, { status: 401 });
    }

    // 2. 初始化 Gemini 引擎 (未来可在这里扩展 provider 分流)
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    // 3. 动态组装包含语言偏好的 Prompt
    const finalPrompt = `${getSystemPrompt(lang)}\n\n待分析句子: "${text.trim()}"`;

    // 4. 发起请求
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite', 
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, 
        maxOutputTokens: 8192, 
      }
    });

    let responseText = response.text;
    
    if (!responseText) {
      throw new Error("EMPTY_RESPONSE");
    }

    // 后台调试日志：排查截断或幻觉
    console.log("=== 🔍 AI 原始返回数据 ===");
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
    // 开发环境：把真实死因打印到屏幕上方便调试
    let friendlyMessage = `哎呀，服务器开小差了。`;

    if (errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE")) {
      friendlyMessage = "当前访问 AI 的人数太多，服务器有点挤爆了。稍等几秒钟再试一次吧！";
    } else if (errorMsg === "JSON_PARSE_ERROR" || errorMsg.includes("SyntaxError")) {
      friendlyMessage = "AI 的数据格式有点乱，没能成功拼装成卡片。请再点一次发送！";
    } else if (errorMsg === "EMPTY_RESPONSE") {
      friendlyMessage = "AI 暂时陷入了沉思，什么也没返回，请重试。";
    } else if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID")) {
      friendlyMessage = "你的 API Key 好像不正确或已失效，请重新检查一下~";
    } else if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      friendlyMessage = "你的 API Key 请求太频繁啦，请稍微休息一分钟再试。";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}