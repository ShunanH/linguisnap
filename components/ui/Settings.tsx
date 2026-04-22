"use client";
import React, { useState, useEffect } from 'react';
import { Trash2, Check, Lock, ChevronDown, Globe, Sparkles } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import CryptoJS from 'crypto-js';

const SECRET_SALT = "linguisnap_secure_salt_2026"; 

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI GPT-4o' },
  { id: 'anthropic', name: 'Claude 3.5' },
];

const LANGUAGES = [
  { id: 'zh-all', name: '全中文解析与翻译' },
  { id: 'zh-parse-en-trans', name: '中文解析 + 英语意译' },
  { id: 'en-all', name: '纯英文解析与翻译' },
];

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [lang, setLang] = useState(LANGUAGES[0].id);

  useEffect(() => {
    const config = localStorage.getItem("linguisnap_config");
    if (config) {
      try {
        const parsed = JSON.parse(config);
        if (parsed.provider) setProvider(parsed.provider);
        if (parsed.lang) setLang(parsed.lang);
        
        const encryptedKey = parsed.keys?.[parsed.provider];
        if (encryptedKey) {
          const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_SALT);
          setApiKey(bytes.toString(CryptoJS.enc.Utf8));
        }
      } catch (e) {
        console.error("配置读取失败");
      }
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    const existingConfig = JSON.parse(localStorage.getItem("linguisnap_config") || '{"keys":{}}');
    existingConfig.provider = provider;
    existingConfig.lang = lang;
    existingConfig.keys[provider] = CryptoJS.AES.encrypt(apiKey, SECRET_SALT).toString();
    localStorage.setItem("linguisnap_config", JSON.stringify(existingConfig));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    const existingConfig = JSON.parse(localStorage.getItem("linguisnap_config") || '{"keys":{}}');
    delete existingConfig.keys[provider]; 
    localStorage.setItem("linguisnap_config", JSON.stringify(existingConfig));
    setApiKey("");
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-4 w-full transition-all relative z-10">
      
      {/* 上半部分：高级下拉菜单区 */}
      <div className="flex flex-wrap gap-4 items-center">
        
        {/* ======================= */}
        {/* 1. 模型厂牌选择器 (Radix) */}
        {/* ======================= */}
        <Select.Root 
          value={provider} 
          onValueChange={(val) => {
            setProvider(val);
            setApiKey(""); 
          }}
        >
          <Select.Trigger className="inline-flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 font-medium hover:bg-slate-100 hover:border-slate-300 transition-colors outline-none focus:ring-2 focus:ring-blue-100 min-w-[160px]">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className={provider === 'gemini' ? 'text-blue-500' : 'text-slate-400'} />
              <Select.Value />
            </div>
            <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
          </Select.Trigger>
          
          <Select.Portal>
            <Select.Content position="popper" sideOffset={6} className="overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] z-[9999] animate-in fade-in zoom-in-95 min-w-[160px]">
              <Select.Viewport className="p-1.5">
                {PROVIDERS.map((p) => (
                  <Select.Item key={p.id} value={p.id} className="relative flex items-center px-6 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer outline-none hover:bg-blue-50 hover:text-blue-700 data-[state=checked]:bg-slate-50 data-[state=checked]:text-slate-900 transition-colors">
                    <Select.ItemText>{p.name}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-1.5 flex items-center justify-center">
                      <Check size={14} className="text-blue-600" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* ======================= */}
        {/* 2. 语言偏好选择器 (Radix) */}
        {/* ======================= */}
        <Select.Root value={lang} onValueChange={setLang}>
          <Select.Trigger className="inline-flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 font-medium hover:bg-slate-100 hover:border-slate-300 transition-colors outline-none focus:ring-2 focus:ring-blue-100 min-w-[190px]">
            <div className="flex items-center gap-1.5">
              <Globe size={14} className="text-slate-400" />
              <Select.Value />
            </div>
            <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
          </Select.Trigger>
          
          <Select.Portal>
            <Select.Content position="popper" sideOffset={6} className="overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] z-[9999] animate-in fade-in zoom-in-95 min-w-[190px]">
              <Select.Viewport className="p-1.5">
                {LANGUAGES.map((l) => (
                  <Select.Item key={l.id} value={l.id} className="relative flex items-center px-7 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer outline-none hover:bg-blue-50 hover:text-blue-700 data-[state=checked]:bg-slate-50 data-[state=checked]:text-slate-900 transition-colors">
                    <Select.ItemText>{l.name}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-1.5 flex items-center justify-center">
                      <Check size={14} className="text-blue-600" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

      </div>

      {/* 下半部分：密码输入框 */}
      <div className="flex items-center gap-3 w-full mt-1">
        <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-600 shrink-0">
          <Lock size={18} />
        </div>
        
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`输入你的 ${PROVIDERS.find(p => p.id === provider)?.name.split(' ')[0]} API Key`}
          className="flex-1 bg-transparent outline-none text-sm font-mono placeholder:text-slate-400 text-slate-700"
        />

        {apiKey && (
          <button onClick={handleClear} className="p-2 text-slate-400 hover:text-red-500 rounded-full shrink-0">
            <Trash2 size={16} />
          </button>
        )}

        <button 
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {saved ? <><Check size={16} /> 已保存设置</> : "保存设置"}
        </button>
      </div>
    </div>
  );
}