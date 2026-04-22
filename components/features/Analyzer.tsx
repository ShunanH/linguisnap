"use client";
import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import CryptoJS from 'crypto-js';
import WordCard from './WordCard';
import { SentenceAnalysis } from '@/lib/prompts';

export default function Analyzer() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SentenceAnalysis | null>(null);
  const [error, setError] = useState("");

  // 🌟 换成了极其简单的入门级句子
  const presetExamples = [
    "She likes reading books.",
    "Ich bin sehr müde.",
    "Él come una manzana."
  ];

  const handleAnalyze = async () => {
    // 1. 读取最新的全局配置 (包含模型、语言和加密的 Key)
    const configStr = localStorage.getItem("linguisnap_config");
    let apiKey = "";
    let provider = "gemini";  // 默认值
    let lang = "zh-all";      // 默认值
    
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        if (config.provider) provider = config.provider;
        if (config.lang) lang = config.lang;
        
        const encryptedKey = config.keys?.[provider];
        if (encryptedKey) {
          const bytes = CryptoJS.AES.decrypt(encryptedKey, "linguisnap_secure_salt_2026");
          apiKey = bytes.toString(CryptoJS.enc.Utf8);
        }
      } catch (e) {
        setError("配置读取失败，请重新在设置中保存！");
        return;
      }
    }

    if (!apiKey) {
      setError("请先在上方配置你的 API Key！");
      return;
    }
    
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 打包发送配置信息
        body: JSON.stringify({ text, apiKey, provider, lang }), 
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "分析失败");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 魔法输入框 */}
      <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative transition-all focus-within:shadow-[0_8px_40px_rgba(59,130,246,0.1)] focus-within:border-blue-100/50">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入目标语言，开启发现之旅！"
          className="w-full h-32 bg-transparent resize-none outline-none p-6 text-lg text-slate-700 placeholder:text-slate-300 font-medium leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
        />
        
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex gap-2">
            {presetExamples.map((ex, i) => (
              <button 
                key={i} 
                onClick={() => setText(ex)}
                className="px-4 py-1.5 bg-slate-50 text-slate-500 text-xs font-semibold rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100"
              >
                {ex}
              </button>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="group relative flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg shadow-slate-900/20"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> 解析中...</>
            ) : (
              <><Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> 解析</>
            )}
          </button>
        </div>
      </div>

      {/* 优雅的报错提示区 */}
      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 flex justify-center px-4">
          <div className="bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 shadow-sm max-w-lg w-full">
            <AlertCircle size={18} className="shrink-0" />
            <p className="leading-relaxed flex-1">{error}</p>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 transition-colors">✕</button>
          </div>
        </div>
      )}

      {/* 结果展示区 */}
      {data && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
          

          {/* 解析卡片网格 */}
          <div className="bg-white/80 backdrop-blur-xl px-10 pt-10 pb-8 rounded-[2rem] border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-0">
            <div className="flex gap-x-10 items-start overflow-x-auto pb-6 w-full custom-scrollbar">
              {data.words.map((word, idx) => (
                <WordCard key={idx} word={word} />
              ))}
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100/60 text-center">
              <p className="text-sm font-medium text-slate-400 tracking-widest uppercase mb-2">整句意译</p>
              <p className="text-xl text-slate-700 font-medium">{data.overallTranslation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}