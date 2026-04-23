"use client";
import React, { useState, useEffect } from 'react';
import { Trash2, Check, Lock, ChevronDown, Globe, Sparkles, Cpu } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import CryptoJS from 'crypto-js';
import { useLanguage } from '@/components/LanguageContext';

const SECRET_SALT = "linguisnap_secure_salt_2026"; 

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'deepseek', name: 'DeepSeek' }, 
];

const PROVIDER_MODELS: Record<string, { id: string, name: string }[]> = {
  gemini: [ { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' }, { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' } ],
  openai: [ { id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4o-mini', name: 'GPT-4o Mini' } ],
  anthropic: [ { id: 'claude-opus-4-7', name: 'Claude Opus 4.7' }, { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5'} ],
  deepseek: [ { id: 'deepseek-chat', name: 'DeepSeek V3.2' }]
};

export default function Settings() {
  const { uiLang, t } = useLanguage(); 

  const DYNAMIC_LANGUAGES = uiLang === 'zh' ? [
    { id: 'zh-all', name: '中文解析与翻译' },
    { id: 'zh-parse-en-trans', name: '中文解析 + 英语意译' },
    { id: 'en-all', name: '英文解析与翻译' },
  ] : [
    { id: 'en-all', name: 'English Parsing & Translation' },
    { id: 'zh-parse-en-trans', name: 'Chinese Parsing + English Trans' },
    { id: 'zh-all', name: 'Chinese Parsing' },
  ];

  const [isPro, setIsPro] = useState(false); 
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [model, setModel] = useState(PROVIDER_MODELS['gemini'][0].id); 
  const [lang, setLang] = useState(DYNAMIC_LANGUAGES[0].id); 

  useEffect(() => {
    const configStr = localStorage.getItem("linguisnap_config");
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        if (config.isPro !== undefined) setIsPro(config.isPro);
        if (config.provider) {
          setProvider(config.provider);
          if (config.model && PROVIDER_MODELS[config.provider]?.some(m => m.id === config.model)) setModel(config.model);
        }
        if (config.lang) setLang(config.lang);
        const encryptedKey = config.keys?.[config.provider || 'gemini'];
        if (encryptedKey) {
          const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_SALT);
          setApiKey(bytes.toString(CryptoJS.enc.Utf8));
        }
      } catch (e) {}
    }

    const handleUiLangSync = () => {
      const newConfigStr = localStorage.getItem("linguisnap_config");
      if (newConfigStr) {
        try { const newConfig = JSON.parse(newConfigStr); if (newConfig.lang) setLang(newConfig.lang); } catch (e) {}
      }
    };
    window.addEventListener('ui_lang_changed', handleUiLangSync);
    return () => window.removeEventListener('ui_lang_changed', handleUiLangSync);
  }, []);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setModel(PROVIDER_MODELS[newProvider][0].id); 
    setApiKey(""); 
  };

  const handleProToggle = () => {
    const newIsPro = !isPro;
    setIsPro(newIsPro);
    const existingConfig = JSON.parse(localStorage.getItem("linguisnap_config") || '{"keys":{}}');
    existingConfig.isPro = newIsPro;
    localStorage.setItem("linguisnap_config", JSON.stringify(existingConfig));
  };

  const handleSave = () => {
    if (!apiKey.trim() && isPro) return;
    const existingConfig = JSON.parse(localStorage.getItem("linguisnap_config") || '{"keys":{}}');
    existingConfig.isPro = isPro;
    existingConfig.provider = provider;
    existingConfig.model = model;
    existingConfig.lang = lang;
    if (isPro) existingConfig.keys[provider] = CryptoJS.AES.encrypt(apiKey, SECRET_SALT).toString();
    localStorage.setItem("linguisnap_config", JSON.stringify(existingConfig));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const handleClear = () => {
    const existingConfig = JSON.parse(localStorage.getItem("linguisnap_config") || '{"keys":{}}');
    if (existingConfig.keys) {
      delete existingConfig.keys[provider]; 
      localStorage.setItem("linguisnap_config", JSON.stringify(existingConfig));
    }
    setApiKey("");
  };


  return (
    <div className="flex flex-col gap-6 w-full mt-4">
      {/* 极客模式开关 */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div>
          <p className="font-bold text-sm text-slate-800">{isPro ? t.settings.proMode : t.settings.basicMode}</p>
          <p className="text-xs text-slate-500 mt-1">{isPro ? t.settings.proDesc : t.settings.basicDesc}</p>
        </div>
        <button 
          onClick={handleProToggle} 
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPro ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPro ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* 🌟 只有极客模式开启时，才显示复杂的表单 */}
      {isPro && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-3">
            {/* 厂牌选择 */}
            <Select.Root value={provider} onValueChange={handleProviderChange}>
              <Select.Trigger className="inline-flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium hover:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-100">
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-slate-400" /><Select.Value /></div>
                <Select.Icon><ChevronDown size={16} className="text-slate-400" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal><Select.Content position="popper" sideOffset={6} className="w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-1"><Select.Viewport>
                {PROVIDERS.map((p) => (
                  <Select.Item key={p.id} value={p.id} className="relative flex items-center px-8 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[state=checked]:bg-slate-50">
                    <Select.ItemText>{p.name}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2"><Check size={14} className="text-blue-600" /></Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport></Select.Content></Select.Portal>
            </Select.Root>

            {/* 模型选择 */}
            <Select.Root value={model} onValueChange={setModel}>
              <Select.Trigger className="inline-flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium hover:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-100">
                <div className="flex items-center gap-2"><Cpu size={16} className="text-slate-400" /><Select.Value /></div>
                <Select.Icon><ChevronDown size={16} className="text-slate-400" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal><Select.Content position="popper" sideOffset={6} className="w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-1"><Select.Viewport>
                {PROVIDER_MODELS[provider]?.map((m) => (
                  <Select.Item key={m.id} value={m.id} className="relative flex items-center px-8 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[state=checked]:bg-slate-50">
                    <Select.ItemText>{m.name}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2"><Check size={14} className="text-blue-600" /></Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport></Select.Content></Select.Portal>
            </Select.Root>

            {/* 语言选择 */}
            <Select.Root value={lang} onValueChange={setLang}>
              <Select.Trigger className="inline-flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium hover:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-100">
                <div className="flex items-center gap-2"><Globe size={16} className="text-slate-400" /><Select.Value /></div>
                <Select.Icon><ChevronDown size={16} className="text-slate-400" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal><Select.Content position="popper" sideOffset={6} className="w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-1"><Select.Viewport>
                {DYNAMIC_LANGUAGES.map((l) => (
                  <Select.Item key={l.id} value={l.id} className="relative flex items-center px-8 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[state=checked]:bg-slate-50">
                    <Select.ItemText>{l.name}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2"><Check size={14} className="text-blue-600" /></Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport></Select.Content></Select.Portal>
            </Select.Root>
          </div>

          {/* 密码输入 */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus-within:ring-2 focus-within:ring-blue-100">
              <Lock size={16} className="text-slate-400" />
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`${t.settings.input} ${PROVIDERS.find(p => p.id === provider)?.name.split(' ')[0]} API Key`} className="flex-1 bg-transparent outline-none text-sm font-mono text-slate-700 w-full" />
              {apiKey && <button onClick={handleClear} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>}
            </div>
            <button onClick={handleSave} disabled={!apiKey.trim()} className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {saved ? <><Check size={16} /> {t.settings.saved}</> : t.settings.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}