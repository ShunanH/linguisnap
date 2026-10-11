"use client";

import { useLanguage } from '@/components/LanguageContext';

const FOOTER_DICT = {
  zh: {
    copyright: "Copyright© 2026 LinguiSnap. 保留所有权利。",
    crafted: "Crafted by Shunan.",
    license: "Github源代码库",
    disclaimer: "免责声明：本工具由AI语言模型驱动，解析结果可能存在误差，仅供学习参考。请勿在此输入任何个人敏感或隐私数据。"
  },
  en: {
    copyright: "Copyright© 2026 LinguiSnap. All rights reserved.",
    crafted: "Crafted by Shunan.",
    license: "Github源代码库",
    disclaimer: "Disclaimer: LinguiSnap is powered by genAI. Results may contain inaccuracies. Please verify independently. Do not input sensitive personal information."
  }
};

export default function Footer() {
  const { uiLang } = useLanguage();
  const t = FOOTER_DICT[uiLang] || FOOTER_DICT.zh;

  return (
    <footer className="w-full py-5 mt-8 border-t border-slate-200 flex flex-col items-center justify-center gap-1.5">
      
      <div className="text-xs font-medium text-slate-500">
        {t.copyright}
      </div>

      <div className="text-[11px] text-slate-400 flex flex-wrap justify-center items-center gap-2 sm:gap-3">
        <span>{t.crafted}</span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <a 
          href="https://github.com/ShunanH/linguisnap"
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-slate-600 transition-colors"
        >
          {t.license}
        </a>
        <span className="text-slate-300">|</span>
      </div>

      <div className="max-w-2xl px-6 text-center mt-1 text-[10px] text-slate-400 leading-normal">
        <p>{t.disclaimer}</p>
      </div>

    </footer>
  );
}