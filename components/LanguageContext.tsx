"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type UiLang = 'zh' | 'en';

export const DICT = {
  zh: {
    header: { subtitle: "你的语言理解助手。", tutorial: "使用教程", menu: "菜单" },
    settings: {
      save: "保存设置", saved: "已保存设置", input: "输入你的",
      proMode: "专业模式", proDesc: "专业模式，可切换各类旗舰模型。",
      basicMode: "学习模式", basicDesc: "无需配置，点击使用。默认使用DeepSeek引擎。"
    },
    analyzer: { 
      placeholder: "输入目标语言，开启发现之旅……", 
      analyze: "解析", analyzing: "解析中...", overall: "整句意译",
    }
  },
  en: {
    header: { subtitle: "Snap your languages.", tutorial: "Tutorial", menu: "Menu" },
    settings: { 
        save: "Save Settings", saved: "Saved Successfully", input: "Enter your" ,
        proMode: "Pro Mode", proDesc: "Bring your own Key, switch flagship models",
        basicMode: "Basic Mode", basicDesc: "No config needed. Default DeepSeek engine."
    },
    analyzer: { 
      placeholder: "Enter any foreign sentence...", 
      analyze: "Analyze", analyzing: "Analyzing...", overall: "Overall Translation",
    }
  }
};

interface LanguageContextType {
  uiLang: UiLang;
  setUiLang: (lang: UiLang) => void;
  t: typeof DICT.zh;
}

const LanguageContext = createContext<LanguageContextType>({
  uiLang: 'zh',
  setUiLang: () => {},
  t: DICT.zh
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setUiLang] = useState<UiLang>('zh');

  useEffect(() => {
    const stored = localStorage.getItem('linguisnap_ui_lang') as UiLang;
    if (stored === 'en' || stored === 'zh') {
      setUiLang(stored);
    } else if (navigator.language.startsWith('en')) {
      setUiLang('en');
    }
  }, []);

  const handleSetUiLang = (lang: UiLang) => {
    setUiLang(lang);
    localStorage.setItem('linguisnap_ui_lang', lang);
    
    const configStr = localStorage.getItem("linguisnap_config") || '{"keys":{}}';
    try {
      const config = JSON.parse(configStr);
      if (lang === 'en') {
        config.lang = 'en-all'; 
      } else {
        config.lang = 'zh-all'; 
      }
      localStorage.setItem("linguisnap_config", JSON.stringify(config));
      
      //Settings 面板更新显示
      window.dispatchEvent(new Event('ui_lang_changed'));
    } catch (e) {}
  };

  return (
    <LanguageContext.Provider value={{ uiLang, setUiLang: handleSetUiLang, t: DICT[uiLang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);